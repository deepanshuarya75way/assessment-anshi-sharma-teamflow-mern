import React, { useState } from 'react';
import { X, Plus, Calendar, Folder } from 'lucide-react';
import api from '../../services/api';

const CreateProjectModal = ({ onClose, onProjectCreated, users }) => {
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    priority: 'medium',
    color: '#6366f1',
    deadline: '',
    members: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name' && !formData.key) {
      // Auto-generate key from first 4 letters
      const autoKey = value.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
      setFormData({ ...formData, name: value, key: autoKey });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleMemberToggle = (userId) => {
    setFormData((prev) => {
      const exists = prev.members.includes(userId);
      return {
        ...prev,
        members: exists
          ? prev.members.filter((id) => id !== userId)
          : [...prev.members, userId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/projects', {
        name: formData.name.trim(),
        key: (formData.key || formData.name.substring(0, 4)).toUpperCase(),
        description: formData.description.trim(),
        priority: formData.priority,
        color: formData.color,
        deadline: formData.deadline || null,
        members: formData.members,
      });

      if (res.data.success) {
        onProjectCreated(res.data.data);
        onClose();
      }
    } catch (err) {
      console.error('Failed to create project:', err);
      setError(err.response?.data?.message || 'Error creating project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content p-6 space-y-5 max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create New Project</h3>
              <p className="text-xs text-slate-400">
                Setup a new workspace for your engineering team
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. NextGen Microservices Migration"
                className="input-field text-xs py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Key Prefix
              </label>
              <input
                type="text"
                name="key"
                maxLength={5}
                value={formData.key}
                onChange={handleChange}
                placeholder="MIGR"
                className="input-field text-xs py-2 uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="input-field text-xs py-2"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Deadline
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="input-field text-xs py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Project Description
            </label>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              placeholder="Summary of goals, roadmap, and architecture..."
              className="input-field text-xs py-2"
            />
          </div>

          {/* Members Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Assign Team Members
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-slate-800">
              {users.map((u) => {
                const isSelected = formData.members.includes(u._id);
                return (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => handleMemberToggle(u._id)}
                    className={`p-2 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-semibold'
                        : 'bg-slate-800/40 border-slate-700/40 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="truncate">
                      <div>{u.name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{u.role}</div>
                    </div>
                    {isSelected && <span className="text-indigo-400 font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-3.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs py-2 px-4"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
