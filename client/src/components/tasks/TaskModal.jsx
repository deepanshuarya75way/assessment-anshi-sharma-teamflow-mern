import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  User,
  MessageSquare,
  Trash2,
  Send,
  Clock,
  Tag,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const TaskModal = ({ task, onClose, onTaskUpdated, onTaskDeleted, users }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [formData, setFormData] = useState({
    title: task.title || '',
    description: task.description || '',
    status: task.status || 'todo',
    priority: task.priority || 'medium',
    assignee: task.assignee?._id || task.assignee || '',
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
  });

  const [comments, setComments] = useState(task.comments || []);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canEditDetails = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin' || user?.role === 'manager';

  // Listen for real-time comment updates
  useEffect(() => {
    if (!socket) return;

    const handleCommentAdded = ({ taskId, comments: updatedComments }) => {
      if (taskId === task._id) {
        setComments(updatedComments);
      }
    };

    socket.on('task:comment_added', handleCommentAdded);

    return () => {
      socket.off('task:comment_added', handleCommentAdded);
    };
  }, [socket, task._id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put(`/tasks/${task._id}`, {
        ...formData,
        assignee: formData.assignee || null,
        dueDate: formData.dueDate || null,
      });
      if (res.data.success) {
        onTaskUpdated(res.data.data);
        onClose();
      }
    } catch (err) {
      console.error('Failed to update task:', err);
      alert(err.response?.data?.message || 'Error updating task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete task "${task.title}"?`)) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      onTaskDeleted(task._id);
      onClose();
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert(err.response?.data?.message || 'Error deleting task');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await api.post(`/tasks/${task._id}/comments`, {
        text: commentText.trim(),
      });
      if (res.data.success) {
        setComments(res.data.data);
        setCommentText('');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content p-6 space-y-6 max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex-1 pr-4">
            <span className="text-[11px] font-mono uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Task Details
            </span>
            {canEditDetails ? (
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field mt-2 text-lg font-bold bg-transparent border-transparent hover:border-slate-700 focus:border-indigo-500 px-0"
                placeholder="Task Title..."
              />
            ) : (
              <h3 className="text-lg font-bold text-slate-100 mt-2">
                {task.title}
              </h3>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Grid */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Status */}
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field text-xs py-2"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="in-review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                disabled={!canEditDetails}
                className="input-field text-xs py-2 disabled:opacity-60"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Assignee
              </label>
              <select
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                disabled={!canEditDetails}
                className="input-field text-xs py-2 disabled:opacity-60"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              disabled={!canEditDetails}
              className="input-field text-xs py-2 disabled:opacity-60"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Description & Notes
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              disabled={!canEditDetails}
              placeholder="Add more details, acceptance criteria, or technical specs..."
              className="input-field text-xs py-2 disabled:opacity-60"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            {canDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>
            ) : (
              <div></div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary text-xs py-2 px-4"
            >
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>

        {/* Comments Section */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Activity & Comments ({comments.length})
            </h4>
          </div>

          {/* Comments List */}
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {comments.map((comment, idx) => (
              <div
                key={comment._id || idx}
                className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">
                      {comment.user?.name || 'User'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {comment.user?.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(comment.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-slate-300">{comment.text}</p>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-xs text-slate-400 italic">
                No comments yet. Start the conversation!
              </p>
            )}
          </div>

          {/* Add Comment Input */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Leave a comment or update for the team..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="input-field text-xs py-2 flex-1"
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !commentText.trim()}
              className="btn-primary text-xs px-3.5 py-2"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
