import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  Layers,
  Calendar,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';

const Dashboard = ({ project, onOpenAIModal, onSelectTask }) => {
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!project?._id) return;
      try {
        setLoading(true);
        const [tasksRes, activitiesRes] = await Promise.all([
          api.get(`/projects/${project._id}/tasks`),
          api.get(`/projects/${project._id}/activities`),
        ]);

        if (tasksRes.data.success) {
          setTasks(tasksRes.data.data);
        }
        if (activitiesRes.data.success) {
          setActivities(activitiesRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [project?._id]);

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-400">
        Please select a project to view metrics.
      </div>
    );
  }

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const inReview = tasks.filter((t) => t.status === 'in-review').length;
  const todo = tasks.filter((t) => t.status === 'todo').length;

  const now = new Date();
  const overdue = tasks.filter(
    (t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now
  );
  const urgent = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done');
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-950/40">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: project.color || '#6366f1' }}
            ></span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {project.name} Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time sprint metrics, task completion rate, and audit activity stream.
          </p>
        </div>

        <button
          onClick={onOpenAIModal}
          className="btn-ai text-xs py-2 px-4 shadow-lg shadow-purple-500/20"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate AI Progress Report</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Work Items
            </span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{total}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Active in current sprint
          </div>
        </div>

        {/* Completion Rate */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Completion Rate
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{completionRate}%</div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>

        {/* Active WIP */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Active WIP (In Progress)
            </span>
            <PlayCircle className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{inProgress}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {inReview} in peer code review
          </div>
        </div>

        {/* Overdue / Urgent Risks */}
        <div
          className={`glass-card p-5 rounded-2xl border ${
            overdue.length > 0
              ? 'border-rose-500/40 bg-rose-500/5'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">
              Overdue Blockers
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{overdue.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {urgent.length} urgent task(s) uncompleted
          </div>
        </div>
      </div>

      {/* Grid: Status Distribution & Overdue Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Breakdown */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Task Pipeline Distribution
          </h3>
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>To Do ({todo})</span>
                <span className="font-mono text-slate-400">
                  {total > 0 ? Math.round((todo / total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-slate-400 h-full"
                  style={{ width: `${total > 0 ? (todo / total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>In Progress ({inProgress})</span>
                <span className="font-mono text-indigo-400">
                  {total > 0 ? Math.round((inProgress / total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full"
                  style={{ width: `${total > 0 ? (inProgress / total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>In Review ({inReview})</span>
                <span className="font-mono text-amber-400">
                  {total > 0 ? Math.round((inReview / total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full"
                  style={{ width: `${total > 0 ? (inReview / total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Done ({done})</span>
                <span className="font-mono text-emerald-400">
                  {total > 0 ? Math.round((done / total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Watchlist */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              High Priority & Overdue Items
            </h3>
            <span className="text-xs text-rose-400 font-semibold">
              {overdue.length + urgent.length} alerts
            </span>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {[...overdue, ...urgent]
              .filter(
                (item, index, self) =>
                  index === self.findIndex((t) => t._id === item._id)
              )
              .map((t) => (
                <div
                  key={t._id}
                  onClick={() => onSelectTask(t)}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-3">
                    <div className="font-semibold text-slate-200 truncate">
                      {t.title}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Assigned: {t.assignee?.name || 'None'}</span>
                      {t.dueDate && (
                        <span className="text-rose-400">
                          Due: {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                </div>
              ))}

            {overdue.length === 0 && urgent.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400 italic">
                All high-priority items and schedules are on track!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Log Audit Stream */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Sprint Activity Audit Log
          </h3>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {activities.map((act) => (
            <div
              key={act._id}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-indigo-300">
                  {act.user?.name ? act.user.name.substring(0, 2).toUpperCase() : 'TF'}
                </div>
                <div>
                  <span className="text-slate-300">{act.details}</span>
                  <div className="text-[10px] text-slate-400">
                    by {act.user?.name} ({act.user?.role})
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                {new Date(act.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="text-xs text-slate-400 italic">No activity logs recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
