import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, LogOut, User, Cpu, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DashboardNavbar = () => {
  const { user, logout } = useAuth();

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Application Logo & Brand */}
        <div className="flex items-center space-x-3">
          <Link
            to="/dashboard"
            className="flex items-center space-x-2.5 group transition-transform duration-150 active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:shadow-indigo-500/40 transition-shadow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white flex items-center">
                HireNex
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI
                </span>
              </span>
              <span className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
                Interview Preparation Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Center Indicator (Hidden on mobile) */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-slate-300">AI Preparation Engine Ready</span>
        </div>

        {/* User Profile & Logout Action */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 pl-2 sm:pl-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-700 to-violet-600 border border-indigo-400/30 flex items-center justify-center text-white font-semibold text-sm shadow-inner">
              {userInitial}
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-medium text-slate-200 leading-tight">
                {user?.username || 'Candidate'}
              </span>
              <span className="text-xs text-slate-400 leading-tight truncate max-w-[150px]">
                {user?.email || ''}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          <button
            onClick={logout}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-xl text-slate-300 hover:text-rose-300 bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 transition-all duration-150 active:scale-95"
            title="Sign out of HireNex"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;

