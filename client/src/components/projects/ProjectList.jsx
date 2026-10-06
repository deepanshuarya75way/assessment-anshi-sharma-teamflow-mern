import React from 'react';
import {
  FolderKanban,
  BarChart3,
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ProjectList = ({
  projects,
  onSelectProject,
  onOpenCreateProject,
  onOpenAIModal,
}) => {
  const { user } = useAuth();
  const canCreate = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-950/40">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Projects Portfolio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Overview of all active engineering projects, sprint targets, and completion rates.
          </p>
        </div>

        {canCreate && (
          <button onClick={onOpenCreateProject} className="btn-primary text-xs py-2 px-4">
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const metrics = project.taskMetrics || {
            total: 0,
            done: 0,
            inProgress: 0,
            overdue: 0,
            completionRate: 0,
          };

          return (
            <div
              key={project._id}
              className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:border-indigo-500/40 transition-all space-y-4 group"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color || '#6366f1' }}
                    ></span>
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {project.key}
                    </span>
                  </div>
                  <span className={`badge badge-${project.priority}`}>
                    {project.priority}
                  </span>
                </div>

                {/* Project Title */}
                <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                  {project.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              {/* Metrics & Progress Bar */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Progress</span>
                  <span className="font-semibold text-slate-200">
                    {metrics.completionRate}% ({metrics.done}/{metrics.total})
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${metrics.completionRate}%` }}
                  ></div>
                </div>

                {metrics.overdue > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-400 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{metrics.overdue} overdue deliverable(s)</span>
                  </div>
                )}
              </div>

              {/* Members Avatars & Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center -space-x-1.5 overflow-hidden">
                  {project.members?.slice(0, 4).map((member, i) => (
                    <div
                      key={member._id || i}
                      className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-indigo-300"
                      title={member.name}
                    >
                      {member.name?.substring(0, 2).toUpperCase()}
                    </div>
                  ))}
                  {project.members?.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-300">
                      +{project.members.length - 4}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectProject(project, 'kanban')}
                    className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Open Kanban Board"
                  >
                    <FolderKanban className="w-3.5 h-3.5" />
                    <span>Board</span>
                  </button>
                  <button
                    onClick={() => onSelectProject(project, 'dashboard')}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Open Analytics Dashboard"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectList;
