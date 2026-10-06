import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  Layers,
  Shield,
  Briefcase,
  User,
  LogOut,
  Wifi,
  WifiOff,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

const Navbar = ({ onOpenAIModal, currentProject }) => {
  const { user, logout, quickLogin } = useAuth();
  const { isConnected } = useSocket();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'badge-role-admin';
      case 'manager':
        return 'badge-role-manager';
      default:
        return 'badge-role-member';
    }
  };

  const handleRoleSwitch = async (targetRole) => {
    await quickLogin(targetRole);
    setShowRoleMenu(false);
  };

  return (
    <header className="glass-panel sticky top-0 z-40 border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
      {/* Brand & Active Scope */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              TeamFlow
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                PRO
              </span>
            </h1>
          </div>
        </div>

        {/* Real-time sync badge */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-400 flex items-center gap-1">
                <Wifi className="w-3 h-3 text-emerald-400" /> Live WebSocket
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-slate-400 flex items-center gap-1">
                <WifiOff className="w-3 h-3 text-amber-400" /> Reconnecting
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* AI Project Summary Trigger */}
        {currentProject && (
          <button
            onClick={onOpenAIModal}
            className="btn-ai text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer"
            title="Generate AI Project Progress Summary"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Sprint Summary</span>
          </button>
        )}

        {/* Interview Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 hover:bg-slate-700/80 text-xs font-medium text-slate-200 transition-all cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span className="capitalize">Role: {user?.role || 'Guest'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50">
              <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Demo Role Switcher (RBAC)
              </div>
              <button
                onClick={() => handleRoleSwitch('admin')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                  user?.role === 'admin'
                    ? 'bg-purple-500/20 text-purple-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Admin (Full Access)</span>
              </button>
              <button
                onClick={() => handleRoleSwitch('manager')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                  user?.role === 'manager'
                    ? 'bg-blue-500/20 text-blue-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                <span>Manager (Tasks & Board)</span>
              </button>
              <button
                onClick={() => handleRoleSwitch('member')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                  user?.role === 'member'
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Member (Assigned Only)</span>
              </button>
            </div>
          )}
        </div>

        {/* User Profile Capsule */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-500/40 flex items-center justify-center font-bold text-xs text-white">
            {user?.name?.substring(0, 2).toUpperCase() || 'TF'}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-100">{user?.name}</div>
            <div className="text-[10px] text-slate-400">{user?.department}</div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1 cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
