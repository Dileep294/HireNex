import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Sparkles,
  Award,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Clock,
  Layers,
  Loader2,
  AlertCircle,
  TrendingUp,
  Printer,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Target,
  ListChecks,
  Code2,
  Lightbulb,
  Compass,
  FileText,
  Share2,
  Info,
  ShieldCheck,
  BookmarkCheck,
  RotateCcw,
} from 'lucide-react';
import DashboardNavbar from '../components/dashboard/DashboardNavbar';
import apiClient from '../api/apiClient';

/**
 * Returns color tokens and qualitative interpretation based on numeric score
 */
const getScoreTier = (score) => {
  const num = Math.max(0, Math.min(100, Number(score) || 0));
  if (num >= 85) {
    return {
      tier: 'Strong Alignment',
      summary:
        'Your profile strongly aligns with the core technical and architectural demands of this role.',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      strokeColor: '#10b981',
      gradient: 'from-emerald-500 to-teal-400',
    };
  }
  if (num >= 70) {
    return {
      tier: 'Competitive Fit',
      summary:
        'You possess a solid foundation with high-relevance experience. Targeted brush-up on key gaps is advised.',
      textColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30',
      strokeColor: '#6366f1',
      gradient: 'from-indigo-500 to-violet-500',
    };
  }
  if (num >= 50) {
    return {
      tier: 'Targeted Growth',
      summary:
        'Demonstrates relevant baseline potential, though substantial preparation in primary technical requirements is recommended.',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      strokeColor: '#f59e0b',
      gradient: 'from-amber-500 to-yellow-400',
    };
  }
  return {
    tier: 'Foundational Match',
    summary:
      'Notable gap between verified background and role requirements. Focused mastery of prerequisite competencies required.',
    textColor: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    strokeColor: '#f43f5e',
    gradient: 'from-rose-500 to-red-400',
  };
};

/**
 * Circular progress ring component
 */
const CircularProgressRing = ({ score = 0, size = 150, strokeWidth = 12 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const normalizedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;
  const tier = getScoreTier(normalizedScore);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-800"
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={tier.strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      {/* Center score label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          {normalizedScore}%
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Match Score
        </span>
      </div>
    </div>
  );
};

export default function InterviewReport() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Core state
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [activeSection, setActiveSection] = useState('overview');
  const [gapFilter, setGapFilter] = useState('All');
  const [expandedTech, setExpandedTech] = useState({});
  const [allTechExpanded, setAllTechExpanded] = useState(false);
  const [expandedBehavioral, setExpandedBehavioral] = useState({});
  const [allBehavioralExpanded, setAllBehavioralExpanded] = useState(false);
  const [completedDays, setCompletedDays] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Fetch report by ID
  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/interviews/${id}`);
      if (response.data?.success && response.data?.data) {
        setReport(response.data.data);
      } else {
        setError('Failed to retrieve interview report details.');
      }
    } catch (err) {
      const status = err.status || err.response?.status;
      const msg = err.message || err.data?.message || err.response?.data?.message;

      if (status === 404) {
        setError('Interview report not found. It may have been deleted or does not exist.');
      } else if (status === 401 || status === 403) {
        setError('You are not authorized to view this report. Please sign in with the proper account.');
      } else if (status === 400) {
        setError(msg || 'Invalid report identifier.');
      } else {
        setError(msg || err.message || 'Network error encountered while loading the report.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReport();
    } else {
      setError('No report ID provided in the URL.');
      setIsLoading(false);
    }
  }, [id]);

  // Expand / collapse all technical questions
  const toggleAllTech = () => {
    const nextState = !allTechExpanded;
    setAllTechExpanded(nextState);
    if (report?.technicalQuestions) {
      const updated = {};
      report.technicalQuestions.forEach((_, idx) => {
        updated[idx] = nextState;
      });
      setExpandedTech(updated);
    }
  };

  // Expand / collapse all behavioral questions
  const toggleAllBehavioral = () => {
    const nextState = !allBehavioralExpanded;
    setAllBehavioralExpanded(nextState);
    if (report?.behavioralQuestions) {
      const updated = {};
      report.behavioralQuestions.forEach((_, idx) => {
        updated[idx] = nextState;
      });
      setExpandedBehavioral(updated);
    }
  };

  // Copy helper
  const handleCopyText = async (text, label, idKey) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(idKey);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (e) {
      toast.error('Failed to copy to clipboard.');
    }
  };

  // Copy full summary
  const handleCopyReportSummary = () => {
    if (!report) return;

    const strengthsText = (report.strengths || [])
      .map((s, i) => {
        const title = typeof s === 'string' ? s : s.skillOrArea;
        const relevance = typeof s === 'string' ? '' : ` - ${s.relevance || s.evidence}`;
        return `${i + 1}. ${title}${relevance}`;
      })
      .join('\n');

    const gapsText = (report.skillGaps || [])
      .map((g, i) => `${i + 1}. [${g.importance} Priority] ${g.skill}: ${g.explanation}`)
      .join('\n');

    const roadmapText = (report.preparationRoadmap || [])
      .map((r) => `Day ${r.day}: ${r.topic} (${r.estimatedMinutes || 60}m)`)
      .join('\n');

    const summaryText = `HireNex AI Interview Preparation Strategy
=============================================
Role: ${report.jobTitle}
Company: ${report.companyName || 'Not specified'}
Match Score: ${report.matchScore}%
Generated: ${new Date(report.createdAt).toLocaleDateString()}

AI Summary / Rationale:
${report.scoreExplanation || report.aiAnalysis || 'N/A'}

Key Candidate Strengths:
${strengthsText || 'None specified'}

Identified Skill Gaps:
${gapsText || 'None identified'}

7-Day Sprint Roadmap:
${roadmapText || 'None available'}
=============================================
Generated by HireNex AI Interview Platform`;

    handleCopyText(summaryText, 'Full Strategy Summary', 'full-summary');
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  // Track roadmap day completion in local state
  const toggleDayCompletion = (day) => {
    setCompletedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <DashboardNavbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">
            Loading Interview Preparation Strategy
          </h2>
          <p className="text-xs text-slate-400 max-w-sm">
            Fetching verified questions, behavioral scenarios, and tailored sprint plan from your database...
          </p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <DashboardNavbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 max-w-md w-full shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Report Unavailable</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              {error || 'The requested interview preparation strategy could not be loaded.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={fetchReport}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Loading</span>
              </button>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/20"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Incomplete / In-Progress Screen
  if (report.status === 'processing') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <DashboardNavbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 max-w-md w-full shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Analysis in Progress</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Gemini AI is actively evaluating your candidate profile and synthesizing custom questions.
              This typically takes a few seconds.
            </p>
            <button
              type="button"
              onClick={fetchReport}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (report.status === 'failed') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <DashboardNavbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 max-w-md w-full shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Generation Unsuccessful</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              {report.aiAnalysis || 'An error occurred during AI analysis. Please return to the dashboard and try again.'}
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Formatting values
  const dateValue = report.createdAt || report.updatedAt;
  const formattedDate = dateValue
    ? new Date(dateValue).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  const tier = getScoreTier(report.matchScore || 0);

  // Skill gaps filtering
  const allSkillGaps = report.skillGaps || [];
  const filteredSkillGaps = allSkillGaps.filter((gap) => {
    if (gapFilter === 'All') return true;
    return gap.importance === gapFilter;
  });

  const highGapsCount = allSkillGaps.filter((g) => g.importance === 'High').length;
  const mediumGapsCount = allSkillGaps.filter((g) => g.importance === 'Medium').length;
  const lowGapsCount = allSkillGaps.filter((g) => g.importance === 'Low').length;

  // Sidebar navigation links
  const NAV_SECTIONS = [
    { id: 'overview', label: 'Executive Overview', icon: BookOpen },
    { id: 'match-score', label: 'Match Score & Fit', icon: Award },
    { id: 'strengths', label: 'Candidate Strengths', icon: CheckCircle2 },
    { id: 'skill-gaps', label: 'Skill Gap Analysis', icon: AlertTriangle },
    { id: 'technical-questions', label: `Technical Questions (${report.technicalQuestions?.length || 0})`, icon: Code2 },
    { id: 'behavioral-questions', label: `Behavioral Scenarios (${report.behavioralQuestions?.length || 0})`, icon: MessageSquare },
    { id: 'roadmap', label: '7-Day Sprint Roadmap', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
      {/* Decorative Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.1),rgba(255,255,255,0))] pointer-events-none no-print" />

      {/* Navigation Header */}
      <div className="no-print">
        <DashboardNavbar />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {/* Top Action Bar & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 no-print">
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-slate-500 group-hover:text-white" />
            <span>Back to Dashboard</span>
          </Link>

          {/* Quick Actions: Print, Copy Summary */}
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleCopyReportSummary}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
              title="Copy markdown summary of this report"
            >
              {copiedId === 'full-summary' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Summary Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600/90 hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-600/20"
              title="Print report or save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Section 2: Report Header Card */}
        <section
          id="overview"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8 mb-8 shadow-2xl print-break-inside-avoid"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Interview Preparation Strategy</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {report.jobTitle}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-400">
                {report.companyName && (
                  <span className="flex items-center space-x-1.5 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/80">
                    <Building className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-slate-200 font-medium">{report.companyName}</span>
                  </span>
                )}
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Generated {formattedDate}</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold uppercase tracking-wider text-[11px]">
                    Completed
                  </span>
                </span>
                <span className="font-mono text-slate-500 text-[11px]">
                  Ref: {report._id?.slice(-8) || id}
                </span>
              </div>
            </div>

            {/* Header Score Chip */}
            <div className={`flex items-center space-x-4 p-4 rounded-2xl border ${tier.bgColor} ${tier.borderColor} flex-shrink-0 shadow-lg`}>
              <div className="text-right">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Estimated Match
                </span>
                <span className={`text-3xl font-extrabold ${tier.textColor}`}>
                  {report.matchScore || 0}%
                </span>
                <span className="text-[11px] block text-slate-300 font-medium">
                  {tier.tier}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-950/60 flex items-center justify-center">
                <Award className={`w-6 h-6 ${tier.textColor}`} />
              </div>
            </div>
          </div>
        </section>

        {/* Layout: Sticky Sidebar Navigation (Desktop) + Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Sidebar (Desktop Sticky) */}
          <aside className="hidden lg:block lg:col-span-1 sticky top-24 space-y-1.5 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl no-print">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 mb-1">
              Table of Contents
            </p>
            {NAV_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{sec.label}</span>
                </a>
              );
            })}

            <div className="pt-3 mt-3 border-t border-slate-800">
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-slate-200 block mb-0.5">Quick Tip:</strong>
                Use the print button to export this roadmap and practice questions as a study guide.
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Section 3: Match Score Visualization & AI Rationale */}
            <section
              id="match-score"
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl print-break-inside-avoid"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
                <div className="flex items-center space-x-2.5">
                  <Award className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-white">Profile Match & Strategic Analysis</h2>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${tier.bgColor} ${tier.borderColor} ${tier.textColor}`}>
                  {tier.tier}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Visual Circular Ring */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                  <CircularProgressRing score={report.matchScore || 0} size={150} strokeWidth={12} />
                  <span className="mt-3 text-xs font-semibold text-slate-300 text-center">
                    Estimated Match Rating
                  </span>
                  <span className="text-[11px] text-slate-500 text-center">
                    Based on verified overlap
                  </span>
                </div>

                {/* AI Explanation & Score Interpretation */}
                <div className="md:col-span-2 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>AI Evaluation Rationale</span>
                  </h3>

                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    {report.scoreExplanation ||
                      report.aiAnalysis ||
                      'Comprehensive profile analysis synthesized against target job specifications.'}
                  </p>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                    <span className="text-indigo-300 font-semibold block">Preparation Guidance:</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {tier.summary}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-500 italic flex items-center space-x-1">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      Match score reflects estimated qualification overlap to guide interview preparation, not a guarantee of hiring outcomes.
                    </span>
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4: Candidate Strengths */}
            <section
              id="strengths"
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl print-break-inside-avoid"
            >
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white">Verified Candidate Strengths</h2>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  {report.strengths?.length || 0} Competencies
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Core areas where your background, technical skills, and past accomplishments directly match or exceed target requirements.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.strengths && report.strengths.length > 0 ? (
                  report.strengths.map((item, idx) => {
                    const isObj = typeof item === 'object' && item !== null;
                    const skill = isObj ? item.skillOrArea : item.split(':')[0];
                    const evidence = isObj ? item.evidence : item;
                    const relevance = isObj ? item.relevance : null;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/30 transition-colors flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start space-x-2.5 mb-2">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-100 leading-snug">
                              {skill}
                            </h3>
                          </div>

                          <div className="space-y-2 text-xs">
                            {evidence && (
                              <div>
                                <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-semibold mb-0.5">
                                  Evidence:
                                </span>
                                <p className="text-slate-300 leading-relaxed text-[11px]">
                                  {evidence}
                                </p>
                              </div>
                            )}

                            {relevance && (
                              <div>
                                <span className="text-emerald-400 text-[11px] uppercase tracking-wider block font-semibold mb-0.5">
                                  Target Role Relevance:
                                </span>
                                <p className="text-slate-300 leading-relaxed text-[11px]">
                                  {relevance}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 p-6 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
                    No specific candidate strengths recorded for this report.
                  </div>
                )}
              </div>
            </section>

            {/* Section 5: Skill Gap Analysis */}
            <section
              id="skill-gaps"
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl print-break-inside-avoid"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center space-x-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-bold text-white">Skill Gap Analysis & Learning Priorities</h2>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {['All', 'High', 'Medium', 'Low'].map((filter) => {
                    const count =
                      filter === 'All'
                        ? allSkillGaps.length
                        : filter === 'High'
                        ? highGapsCount
                        : filter === 'Medium'
                        ? mediumGapsCount
                        : lowGapsCount;

                    const isCurrent = gapFilter === filter;
                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setGapFilter(filter)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                          isCurrent
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {filter} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Technologies, domain knowledge, or architectural patterns required by the role that were either absent or minimally emphasized in your profile.
              </p>

              <div className="space-y-4">
                {filteredSkillGaps.length > 0 ? (
                  filteredSkillGaps.map((gap, idx) => {
                    const isHigh = gap.importance === 'High';
                    const isMedium = gap.importance === 'Medium';

                    return (
                      <div
                        key={idx}
                        className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-white">{gap.skill}</span>
                          </div>

                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                              isHigh
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : isMedium
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {gap.importance || 'Medium'} Priority
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed mb-3">
                          {gap.explanation}
                        </p>

                        {gap.suggestedLearning && gap.suggestedLearning.length > 0 && (
                          <div className="mt-2 pt-3 border-t border-slate-900 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-indigo-300 font-semibold mr-1 flex items-center space-x-1">
                              <Lightbulb className="w-3 h-3 text-indigo-400" />
                              <span>Focus Topics:</span>
                            </span>
                            {gap.suggestedLearning.map((topic, tidx) => (
                              <span
                                key={tidx}
                                className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
                    No skill gaps found for priority filter &quot;{gapFilter}&quot;.
                  </div>
                )}
              </div>
            </section>

            {/* Section 6: Technical Interview Questions (15 Questions) */}
            <section
              id="technical-questions"
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl print-break-inside-avoid"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center space-x-2.5">
                  <Code2 className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h2 className="text-lg font-bold text-white">Targeted Technical Interview Questions</h2>
                    <p className="text-xs text-slate-400">
                      15 role-specific questions with recommended solutions and architectural rationale
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleAllTech}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 self-start sm:self-auto transition-colors"
                >
                  {allTechExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Collapse All</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Expand All</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-4">
                {report.technicalQuestions && report.technicalQuestions.length > 0 ? (
                  report.technicalQuestions.map((q, idx) => {
                    const isExpanded = expandedTech[idx] ?? false;
                    const isHard = q.difficulty === 'Hard';
                    const isMedium = q.difficulty === 'Medium';
                    const copyKey = `tech-${idx}`;

                    return (
                      <div
                        key={idx}
                        className="rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors overflow-hidden"
                      >
                        {/* Question Header (Always Visible) */}
                        <div
                          onClick={() =>
                            setExpandedTech((prev) => ({
                              ...prev,
                              [idx]: !prev[idx],
                            }))
                          }
                          className="p-4 sm:p-5 cursor-pointer flex items-start justify-between gap-3 select-none"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                                #{idx + 1}
                              </span>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {q.topic || 'Engineering'}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                  isHard
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                    : isMedium
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {q.difficulty || 'Medium'}
                              </span>
                            </div>

                            <h3 className="text-sm font-semibold text-slate-100 leading-snug">
                              {q.question}
                            </h3>
                          </div>

                          <div className="flex items-center space-x-2 pt-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const text = `Question: ${q.question}\nTopic: ${q.topic}\nDifficulty: ${q.difficulty}\n\nRecommended Answer:\n${q.detailedAnswer}\n\nSignal / Rationale:\n${q.explanation}`;
                                handleCopyText(text, `Question #${idx + 1}`, copyKey);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Copy question and answer"
                            >
                              {copiedId === copyKey ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            <div className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expandable Answer Section */}
                        {isExpanded && (
                          <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-2 border-t border-slate-900 space-y-3 bg-slate-900/40">
                            {q.detailedAnswer && (
                              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                                <span className="text-indigo-300 font-bold block mb-1.5 uppercase tracking-wider text-[10px]">
                                  Model Technical Answer:
                                </span>
                                <p className="text-slate-200 leading-relaxed whitespace-pre-line font-mono text-[11px] sm:text-xs">
                                  {q.detailedAnswer}
                                </p>
                              </div>
                            )}

                            {q.explanation && (
                              <div className="text-xs text-slate-400 leading-relaxed">
                                <strong className="text-slate-300">Interviewer Signal: </strong>
                                {q.explanation}
                              </div>
                            )}

                            {q.relatedSkills && q.relatedSkills.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                                  Related Skills:
                                </span>
                                {q.relatedSkills.map((sk, sidx) => (
                                  <span
                                    key={sidx}
                                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                                  >
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
                    No technical questions generated for this report.
                  </div>
                )}
              </div>
            </section>

            {/* Section 7: Behavioral Questions (10 Questions - STAR Framework) */}
            <section
              id="behavioral-questions"
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl print-break-inside-avoid"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center space-x-2.5">
                  <MessageSquare className="w-5 h-5 text-violet-400" />
                  <div>
                    <h2 className="text-lg font-bold text-white">Behavioral Interview Scenarios (STAR Model)</h2>
                    <p className="text-xs text-slate-400">
                      10 scenario-based questions with structured Situation, Task, Action, Result frameworks
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleAllBehavioral}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 self-start sm:self-auto transition-colors"
                >
                  {allBehavioralExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Collapse All</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Expand All</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-4">
                {report.behavioralQuestions && report.behavioralQuestions.length > 0 ? (
                  report.behavioralQuestions.map((b, idx) => {
                    const isExpanded = expandedBehavioral[idx] ?? false;
                    const copyKey = `behavioral-${idx}`;
                    const star = b.suggestedStarStructure;
                    const isStarObj = star && typeof star === 'object';

                    return (
                      <div
                        key={idx}
                        className="rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors overflow-hidden"
                      >
                        {/* Header Row */}
                        <div
                          onClick={() =>
                            setExpandedBehavioral((prev) => ({
                              ...prev,
                              [idx]: !prev[idx],
                            }))
                          }
                          className="p-4 sm:p-5 cursor-pointer flex items-start justify-between gap-3 select-none"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-violet-600/20 text-violet-300 border border-violet-500/30">
                                BQ #{idx + 1}
                              </span>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                Evaluates: {b.evaluates || 'Ownership & Execution'}
                              </span>
                            </div>

                            <h3 className="text-sm font-semibold text-slate-100 leading-snug">
                              {b.question}
                            </h3>
                          </div>

                          <div className="flex items-center space-x-2 pt-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const starText = isStarObj
                                  ? `Situation: ${star.situation}\nTask: ${star.task}\nAction: ${star.action}\nResult: ${star.result}`
                                  : star || '';
                                const text = `Question: ${b.question}\nEvaluates: ${b.evaluates}\n\nSTAR Framework:\n${starText}\n\nSample Answer:\n${b.exampleAnswer}\n\nTips:\n${b.tips}`;
                                handleCopyText(text, `Behavioral Q #${idx + 1}`, copyKey);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Copy behavioral scenario and STAR breakdown"
                            >
                              {copiedId === copyKey ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            <div className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-2 border-t border-slate-900 space-y-4 bg-slate-900/40">
                            {/* STAR Framework Matrix */}
                            {isStarObj ? (
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300 block mb-2">
                                  STAR Structured Response Blueprint:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                                    <strong className="text-indigo-400 block mb-0.5 text-[11px] uppercase">
                                      Situation
                                    </strong>
                                    <p className="text-slate-300 text-[11px] leading-relaxed">
                                      {star.situation}
                                    </p>
                                  </div>

                                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                                    <strong className="text-indigo-400 block mb-0.5 text-[11px] uppercase">
                                      Task
                                    </strong>
                                    <p className="text-slate-300 text-[11px] leading-relaxed">
                                      {star.task}
                                    </p>
                                  </div>

                                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                                    <strong className="text-violet-400 block mb-0.5 text-[11px] uppercase">
                                      Action
                                    </strong>
                                    <p className="text-slate-300 text-[11px] leading-relaxed">
                                      {star.action}
                                    </p>
                                  </div>

                                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                                    <strong className="text-emerald-400 block mb-0.5 text-[11px] uppercase">
                                      Result
                                    </strong>
                                    <p className="text-slate-300 text-[11px] leading-relaxed">
                                      {star.result}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : star ? (
                              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                                <strong className="text-violet-300 block mb-1">STAR Guidance:</strong>
                                {star}
                              </div>
                            ) : null}

                            {/* Example Answer */}
                            {b.exampleAnswer && (
                              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                                <span className="text-violet-300 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                                  Grounded Sample Answer:
                                </span>
                                <p className="text-slate-200 leading-relaxed text-[11px] sm:text-xs">
                                  {b.exampleAnswer}
                                </p>
                              </div>
                            )}

                            {/* Preparation Tips */}
                            {b.tips && (
                              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs flex items-start space-x-2">
                                <Lightbulb className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                                <div className="text-[11px] leading-relaxed">
                                  <strong className="text-indigo-300">Tactical Tip: </strong>
                                  <span className="text-slate-300">{b.tips}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
                    No behavioral questions generated for this report.
                  </div>
                )}
              </div>
            </section>

            {/* Section 8: 7-Day Sprint Roadmap */}
            <section
              id="roadmap"
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl print-break-inside-avoid"
            >
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center space-x-2.5">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h2 className="text-lg font-bold text-white">7-Day Structured Preparation Sprint</h2>
                    <p className="text-xs text-slate-400">
                      Day-by-day objectives, practice tasks, and estimated study time
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
                  <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                  <span>Check off completed days as you prepare</span>
                </div>
              </div>

              <div className="space-y-4">
                {report.preparationRoadmap && report.preparationRoadmap.length > 0 ? (
                  report.preparationRoadmap.map((dayItem, idx) => {
                    const dayNum = dayItem.day || idx + 1;
                    const isDone = completedDays[dayNum] ?? false;
                    const hours = Math.round(((dayItem.estimatedMinutes || 60) / 60) * 10) / 10;

                    return (
                      <div
                        key={idx}
                        className={`p-4 sm:p-5 rounded-xl border transition-all ${
                          isDone
                            ? 'bg-slate-950/40 border-emerald-500/30'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => toggleDayCompletion(dayNum)}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
                                isDone
                                  ? 'bg-emerald-600 border-emerald-500 text-white'
                                  : 'bg-slate-900 border-slate-700 text-transparent hover:border-slate-500'
                              }`}
                              title={isDone ? 'Mark day as incomplete' : 'Mark day as complete'}
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                            </button>

                            <div>
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 block">
                                Day {dayNum} Sprint
                              </span>
                              <h3
                                className={`text-sm font-bold ${
                                  isDone ? 'line-through text-slate-500' : 'text-slate-100'
                                }`}
                              >
                                {dayItem.topic}
                              </h3>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>
                              {dayItem.estimatedMinutes || 60}m ({hours}h)
                            </span>
                          </div>
                        </div>

                        {/* Learning Objectives */}
                        {dayItem.learningObjectives && (
                          <div className="mb-3 text-xs">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                              Learning Objectives:
                            </span>
                            {Array.isArray(dayItem.learningObjectives) ? (
                              <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5">
                                {dayItem.learningObjectives.map((obj, oidx) => (
                                  <li key={oidx}>{obj}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-slate-300 text-[11px]">{dayItem.learningObjectives}</p>
                            )}
                          </div>
                        )}

                        {/* Tasks & Practice Activities */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-900 text-xs">
                          {dayItem.tasks && dayItem.tasks.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300 block">
                                Action Items & Study:
                              </span>
                              <ul className="space-y-1">
                                {dayItem.tasks.map((task, tidx) => (
                                  <li key={tidx} className="flex items-start space-x-1.5 text-[11px] text-slate-300">
                                    <span className="text-indigo-400 font-bold">•</span>
                                    <span>{task}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {dayItem.practiceActivities && dayItem.practiceActivities.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300 block">
                                Hands-on Exercises:
                              </span>
                              <ul className="space-y-1">
                                {dayItem.practiceActivities.map((act, aidx) => (
                                  <li key={aidx} className="flex items-start space-x-1.5 text-[11px] text-slate-300">
                                    <span className="text-emerald-400 font-bold">✓</span>
                                    <span>{act}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
                    No roadmap sprint generated for this report.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
