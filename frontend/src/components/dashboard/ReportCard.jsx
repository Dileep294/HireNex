import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Building,
  ArrowRight,
  TrendingUp,
  Clock,
  AlertCircle,
  Trash2,
  Eye,
  CheckCircle2,
} from 'lucide-react';

const getScoreColor = (score) => {
  if (score >= 90) {
    return {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
    };
  }
  if (score >= 80) {
    return {
      text: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
    };
  }
  if (score >= 60) {
    return {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
    };
  }
  return {
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  };
};

const ReportCard = ({ report, onDelete = null }) => {
  const navigate = useNavigate();
  const reportId = report._id || report.id;
  const company = report.companyName || report.company;
  const dateVal = report.createdAt || report.generatedDate;
  const scoreColors = getScoreColor(report.matchScore || 0);

  const formattedDate = dateVal
    ? new Date(dateVal).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  const handleCardClick = () => {
    navigate(`/reports/${reportId}`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(report);
    }
  };

  // Extract skills/strengths tags
  const tags = [];
  if (report.strengths && Array.isArray(report.strengths)) {
    report.strengths.slice(0, 3).forEach((s) => {
      const tagText = typeof s === 'string' ? s.split(':')[0] : s.skillOrArea || '';
      if (tagText) tags.push(tagText.slice(0, 25));
    });
  } else if (report.skillsMatched && Array.isArray(report.skillsMatched)) {
    report.skillsMatched.slice(0, 3).forEach((s) => tags.push(s));
  }

  const isCompleted = report.status === 'completed' || !report.status;
  const isFailed = report.status === 'failed';
  const isProcessing = report.status === 'processing';

  return (
    <div
      onClick={handleCardClick}
      className="group relative cursor-pointer rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 p-5 sm:p-6 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between"
    >
      <div>
        {/* Status / Score Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="overflow-hidden flex-1">
            <h3 className="font-semibold text-base sm:text-lg text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
              {report.jobTitle}
            </h3>
            {company && (
              <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-0.5 truncate">
                <Building className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="truncate">{company}</span>
              </p>
            )}
          </div>

          {/* Match Score Badge */}
          {isCompleted && (
            <div
              className={`flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-xl ${scoreColors.bg} border ${scoreColors.border}`}
            >
              <TrendingUp className={`w-3.5 h-3.5 ${scoreColors.text}`} />
              <span className={`text-xs font-bold ${scoreColors.text}`}>
                {report.matchScore}% Match
              </span>
            </div>
          )}

          {isProcessing && (
            <div className="flex-shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs">
              <Clock className="w-3 h-3 animate-spin" />
              <span>Processing</span>
            </div>
          )}

          {isFailed && (
            <div className="flex-shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>Failed</span>
            </div>
          )}
        </div>

        {/* Summary Snippet */}
        {(report.aiAnalysis || report.scoreExplanation || report.summary) && (
          <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
            {report.aiAnalysis || report.scoreExplanation || report.summary}
          </p>
        )}

        {/* Competency Badges */}
        {tags.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-950/70 border border-slate-800 text-slate-300 truncate max-w-[150px]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom row: Date & Actions */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-500 flex items-center space-x-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </span>

        <div className="flex items-center space-x-2">
          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Delete report"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleCardClick}
            className="inline-flex items-center space-x-1 font-medium text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all"
          >
            <span>View Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
