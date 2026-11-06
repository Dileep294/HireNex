import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import DashboardNavbar from '../components/dashboard/DashboardNavbar';
import apiClient from '../api/apiClient';

const getScoreColor = (score) => {
  if (score >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  if (score >= 80) return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
  return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
};

const ReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/interviews/${id}`);
        if (response.data?.success && response.data?.data) {
          setReport(response.data.data);
        } else {
          setError('Failed to retrieve report details.');
        }
      } catch (err) {
        setError(
          err.response?.data?.message || err.message || 'Report not found or inaccessible.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <DashboardNavbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
          <p className="text-sm text-slate-400">Loading interview strategy...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <DashboardNavbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 max-w-md w-full">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <h2 className="text-lg font-semibold text-white mb-1">Report Unavailable</h2>
            <p className="text-xs text-rose-300 mb-4">{error || 'Report not found.'}</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const dateValue = report.createdAt || report.generatedDate;
  const formattedDate = dateValue
    ? new Date(dateValue).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  const scoreBadgeStyle = getScoreColor(report.matchScore || 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DashboardNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Report Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-violet-950/60 border border-slate-800 p-6 sm:p-8 mb-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Interview Preparation Strategy</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
                {report.jobTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                {report.companyName && (
                  <span className="flex items-center space-x-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-300 font-medium">{report.companyName}</span>
                  </span>
                )}
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Generated {formattedDate}</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono">ID: {report._id?.slice(-8) || id}</span>
                </span>
              </div>
            </div>

            {/* Score Pill */}
            <div className={`flex items-center space-x-4 p-4 rounded-2xl border ${scoreBadgeStyle} flex-shrink-0`}>
              <div className="flex flex-col text-right">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-300">
                  Profile Match
                </span>
                <span className="text-3xl font-extrabold">
                  {report.matchScore || 0}%
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-950/60 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Questions & Detailed Strategy */}
          <div className="lg:col-span-2 space-y-8">
            {/* Executive Analysis Summary */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-7">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span>Executive Strategy Overview</span>
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                {report.aiAnalysis || 'Comprehensive strategy synthesized based on verified profile competencies.'}
              </p>
            </div>

            {/* High-Frequency Technical Questions (15 Questions) */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-7">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-indigo-400" />
                  <span>Targeted Technical Questions</span>
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {report.technicalQuestions?.length || 0} Questions
                </span>
              </div>

              <div className="space-y-4">
                {report.technicalQuestions?.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {q.topic || 'Core Engineering'}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          q.difficulty === 'Hard'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : q.difficulty === 'Medium'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {q.difficulty || 'Medium'}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-100 mb-2">
                      {idx + 1}. {q.question}
                    </h3>

                    {q.detailedAnswer && (
                      <div className="mt-2 text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                        <strong className="text-indigo-300 block mb-1">Recommended Solution:</strong>
                        {q.detailedAnswer}
                      </div>
                    )}

                    {q.explanation && (
                      <p className="mt-2 text-[11px] text-slate-400 italic">
                        <strong>Signal:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Behavioral Questions (10 Questions - STAR Format) */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-7">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                  <span>Behavioral Scenarios (STAR Framework)</span>
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {report.behavioralQuestions?.length || 0} Questions
                </span>
              </div>

              <div className="space-y-4">
                {report.behavioralQuestions?.map((b, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {b.evaluates || 'Leadership & Problem Solving'}
                      </span>
                      <span className="text-[11px] text-slate-500">STAR Model</span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-100 mb-2">
                      {idx + 1}. {b.question}
                    </h3>

                    {b.suggestedStarStructure && typeof b.suggestedStarStructure === 'object' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-900/70 p-3 rounded-lg border border-slate-800/80 my-2">
                        <div>
                          <span className="text-indigo-400 font-semibold">Situation: </span>
                          <span className="text-slate-300">{b.suggestedStarStructure.situation}</span>
                        </div>
                        <div>
                          <span className="text-indigo-400 font-semibold">Task: </span>
                          <span className="text-slate-300">{b.suggestedStarStructure.task}</span>
                        </div>
                        <div>
                          <span className="text-violet-400 font-semibold">Action: </span>
                          <span className="text-slate-300">{b.suggestedStarStructure.action}</span>
                        </div>
                        <div>
                          <span className="text-emerald-400 font-semibold">Result: </span>
                          <span className="text-slate-300">{b.suggestedStarStructure.result}</span>
                        </div>
                      </div>
                    )}

                    {b.exampleAnswer && (
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        <strong className="text-slate-200">Grounded Example: </strong>
                        {b.exampleAnswer}
                      </p>
                    )}

                    {b.tips && (
                      <p className="text-[11px] text-indigo-300 mt-1.5">
                        💡 <strong>Tip: </strong> {b.tips}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Strengths, Skill Gaps & 7-Day Sprint */}
          <div className="space-y-6">
            {/* Candidate Strengths */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified Candidate Strengths</span>
              </h3>
              <div className="space-y-2.5">
                {report.strengths?.map((s, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
                    <span className="font-semibold text-emerald-300 block">
                      {typeof s === 'string' ? s.split(':')[0] : s.skillOrArea}
                    </span>
                    <span className="text-slate-400 mt-0.5 block leading-relaxed">
                      {typeof s === 'string' ? s : s.evidence || s.relevance}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Gaps Analysis */}
            {report.skillGaps && report.skillGaps.length > 0 && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Identified Skill Gaps</span>
                </h3>
                <div className="space-y-3">
                  {report.skillGaps.map((gap, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-200">{gap.skill}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            gap.importance === 'High'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {gap.importance} Priority
                        </span>
                      </div>
                      <p className="text-slate-400 leading-relaxed mb-2">{gap.explanation}</p>
                      {gap.suggestedLearning?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {gap.suggestedLearning.map((topic, tidx) => (
                            <span key={tidx} className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7-Day Sprint Roadmap */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-violet-400" />
                <span>7-Day Preparation Sprint</span>
              </h3>
              <div className="space-y-3 text-xs">
                {report.preparationRoadmap?.map((dayItem, idx) => (
                  <div key={idx} className="border-l-2 border-indigo-500 pl-3 py-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">
                        Day {dayItem.day || idx + 1}: {dayItem.topic}
                      </span>
                      {dayItem.estimatedMinutes && (
                        <span className="text-[10px] font-mono text-slate-500">
                          {dayItem.estimatedMinutes}m
                        </span>
                      )}
                    </div>
                    {dayItem.tasks?.length > 0 && (
                      <p className="text-slate-400 mt-1 leading-relaxed">
                        • {dayItem.tasks[0]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportDetails;
