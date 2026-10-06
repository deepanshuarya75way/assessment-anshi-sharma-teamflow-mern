import React from 'react';
import {
  FolderKanban,
  LayoutGrid,
  BarChart3,
  Plus,
  FolderOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({
  activeTab,
  setActiveTab,
  projects,
  selectedProject,
  setSelectedProject,
  onOpenNewProjectModal,
}) => {
  const { user } = useAuth();
  const canCreateProject = user?.role === 'admin' || user?.role === 'manager';

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 flex flex-col justify-between p-4 h-[calc(100vh-61px)]">
      <div className="space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Workspaces
          </div>
          <button
            onClick={() => setActiveTab('kanban')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'kanban'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FolderKanban className="w-4 h-4 text-indigo-400" />
            <span>Kanban Board</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>Dashboard & Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-indigo-400" />
            <span>All Projects</span>
          </button>
        </div>

        {/* Project Selector List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Projects ({projects.length})
            </span>
            {canCreateProject && (
              <button
                onClick={onOpenNewProjectModal}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Create New Project"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {projects.map((project) => {
              const isSelected = selectedProject?._id === project._id;
              return (
                <button
                  key={project._id}
                  onClick={() => {
                    setSelectedProject(project);
                    if (activeTab === 'projects') setActiveTab('kanban');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 text-white border-l-2 border-indigo-500 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color || '#6366f1' }}
                    ></span>
                    <span className="truncate">{project.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                    {project.key}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-300 mb-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>TeamFlow Enterprise</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Role-Based Access + Real-time Socket.io Kanban + AI Insights.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
