import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center animate-pulse">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-300">Loading HireNex...</p>
        <p className="text-xs text-slate-500 mt-0.5">Preparing your AI interview workspace</p>
      </div>
    </div>
  </div>
);

export default LoadingFallback;
