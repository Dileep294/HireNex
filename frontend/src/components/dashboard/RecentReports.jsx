import React from 'react';
import { History, Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import ReportCard from './ReportCard';

const RecentReports = ({
  reports = [],
  isLoading = false,
  error = null,
  onRetry = null,
}) => {
  return (
    <section className="mt-12 sm:mt-16">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Recent Interview Plans
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {reports.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review your previously generated custom interview questions, skill evaluations, and preparation strategies.
          </p>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isLoading}
            className="self-start sm:self-auto text-xs text-slate-400 hover:text-indigo-300 flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-300">Loading interview plans...</p>
        </div>
      ) : error ? (
        /* Error State */
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-rose-300">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      ) : reports.length > 0 ? (
        /* Reports Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <ReportCard key={report._id || report.id} report={report} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No interview strategies yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Paste a job description and upload your resume above to create your first AI-tailored interview plan.
          </p>
        </div>
      )}
    </section>
  );
};

export default RecentReports;
