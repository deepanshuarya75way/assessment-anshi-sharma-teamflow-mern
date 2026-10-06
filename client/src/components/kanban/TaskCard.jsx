import React from 'react';
import {
  Calendar,
  MessageSquare,
  AlertCircle,
  Clock,
  User,
  Tag,
} from 'lucide-react';

const TaskCard = ({ task, onSelectTask, onDragStart, onDragEnd }) => {
  const isOverdue =
    task.dueDate &&
    task.status !== 'done' &&
    new Date(task.dueDate) < new Date();

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="badge badge-urgent">Urgent</span>;
      case 'high':
        return <span className="badge badge-high">High</span>;
      case 'medium':
        return <span className="badge badge-medium">Medium</span>;
      default:
        return <span className="badge badge-low">Low</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onSelectTask(task)}
      className="task-card group cursor-grab active:cursor-grabbing hover:border-indigo-500/40 relative"
    >
      {/* Top row: Priority & Tags */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {getPriorityBadge(task.priority)}
          {task.tags && task.tags.length > 0 && (
            <span className="text-[10px] font-medium text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
              #{task.tags[0]}
            </span>
          )}
        </div>

        {/* Due Date Indicator */}
        {task.dueDate && (
          <div
            className={`flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
              isOverdue
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 bg-slate-800/50'
            }`}
            title={isOverdue ? 'Task is Overdue!' : 'Due Date'}
          >
            {isOverdue ? (
              <AlertCircle className="w-3 h-3 text-rose-400" />
            ) : (
              <Clock className="w-3 h-3 text-slate-500" />
            )}
            <span>{formatDate(task.dueDate)}</span>
          </div>
        )}
      </div>

      {/* Task Title */}
      <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2 mb-1.5 leading-snug">
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* Bottom row: Assignee Avatar & Comments count */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1 text-xs">
        {/* Assignee */}
        <div className="flex items-center gap-1.5">
          {task.assignee ? (
            <div
              className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
              title={`Assigned to: ${task.assignee.name}`}
            >
              {task.assignee.avatar || task.assignee.name.substring(0, 2).toUpperCase()}
            </div>
          ) : (
            <div
              className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500"
              title="Unassigned"
            >
              <User className="w-3 h-3" />
            </div>
          )}
          <span className="text-[11px] text-slate-400 truncate max-w-[110px]">
            {task.assignee ? task.assignee.name.split(' ')[0] : 'Unassigned'}
          </span>
        </div>

        {/* Comment count */}
        {task.comments && task.comments.length > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{task.comments.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
