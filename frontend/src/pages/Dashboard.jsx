import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Zap,
  Award,
  FolderKanban,
  FileCheck2,
  Code2,
  Trash2,
} from 'lucide-react';
import DashboardNavbar from '../components/dashboard/DashboardNavbar';
import JobDescriptionInput from '../components/dashboard/JobDescriptionInput';
import CandidateProfileInput from '../components/dashboard/CandidateProfileInput';
import RecentReports from '../components/dashboard/RecentReports';
import apiClient from '../api/apiClient';

const GENERATION_STEPS = [
  'Extracting core competencies and tech stack from job description...',
  'Analyzing your profile against the job requirements...',
  'Evaluating verified candidate skills, education and experience gaps...',
  'Cross-referencing industry rubrics to synthesize targeted interview questions...',
  'Finalizing custom 7-day preparation roadmap and strategy...',
];

const Dashboard = () => {
  const navigate = useNavigate();

  // Input states
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [selfDescription, setSelfDescription] = useState('');
  const [customJobTitle, setCustomJobTitle] = useState('');
  const [customCompany, setCustomCompany] = useState('');

  // Validation errors
  const [errors, setErrors] = useState({
    jobDescription: '',
    profile: '',
  });

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  // Recent reports state loaded from backend API
  const [reports, setReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [reportsError, setReportsError] = useState(null);

  // Real Database Statistics state
  const [stats, setStats] = useState({
    totalPlans: 0,
    completedPlans: 0,
    averageScore: 0,
    technicalQuestionsGenerated: 0,
  });

  // Delete modal state for recent reports
  const [reportToDelete, setReportToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch candidate's report history from backend
  const fetchReports = async () => {
    setIsLoadingReports(true);
    setReportsError(null);
    try {
      const res = await apiClient.get('/interviews');
      if (res.data?.success) {
        setReports(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setReportsError('Unable to load recent interview plans.');
    } finally {
      setIsLoadingReports(false);
    }
  };

  // Fetch candidate's real aggregate database statistics
  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/interviews/stats');
      if (res.data?.success && res.data?.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.warn('Could not load database stats:', err.message);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, []);

  // Validation logic
  const isJobDescriptionValid = jobDescription.trim().length >= 30;
  const isProfileValid = Boolean(
    resumeFile || selfDescription.trim().length >= 10
  );
  const isFormValid = isJobDescriptionValid && isProfileValid;

  // Primary action: generate customized interview strategy
  const handleGenerateStrategy = async () => {
    if (isGenerating) return;

    const newErrors = {};

    if (!isJobDescriptionValid) {
      newErrors.jobDescription =
        'Please provide a target job description (at least 30 characters).';
    }

    if (!isProfileValid) {
      newErrors.profile =
        'Either upload your PDF resume or provide a self-description (at least 10 characters).';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please complete all required fields before generating.');
      return;
    }

    // Determine role title: custom or auto-extracted from first line of JD
    let roleTitle = customJobTitle.trim();
    if (!roleTitle) {
      const firstLine =
        jobDescription
          .split('\n')
          .map((l) => l.trim())
          .find((l) => l.length > 3) || 'Software Engineer';
      roleTitle =
        firstLine
          .replace(/^(role|title|position|job\s*title):/i, '')
          .trim()
          .slice(0, 100) || 'Target Software Position';
    }

    // Begin AI Generation sequence
    setIsGenerating(true);
    setGenerationStep(0);

    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev < GENERATION_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2500);

    try {
      const payload = {
        jobTitle: roleTitle,
        companyName: customCompany.trim() || '',
        jobDescription: jobDescription.trim(),
        selfDescription: selfDescription.trim(),
        resumeFileName: resumeFile?.fileName || '',
        resumeText: resumeFile?.extractedText || '',
      };

      const response = await apiClient.post('/interviews/generate', payload);

      clearInterval(stepInterval);

      if (response.data?.success && response.data?.data) {
        const createdReport = response.data.data;
        toast.success('Your Interview Strategy has been created!');
        // Refresh recent reports and stats in background
        fetchReports();
        fetchStats();
        // Redirect to real report view
        navigate(`/reports/${createdReport._id}`);
      }
    } catch (err) {
      clearInterval(stepInterval);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to generate interview strategy. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete report handler
  const confirmDelete = async () => {
    if (!reportToDelete) return;

    setIsDeleting(true);
    const reportId = reportToDelete._id || reportToDelete.id;

    try {
      const response = await apiClient.delete(`/interviews/${reportId}`);

      if (response.data?.success) {
        toast.success(`Deleted plan for "${reportToDelete.jobTitle}"`);
        setReportToDelete(null);
        // Refresh list and stats
        fetchReports();
        fetchStats();
      } else {
        toast.error('Failed to delete report.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not delete report.';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Background Decorative Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.12),rgba(255,255,255,0))] pointer-events-none" />

      {/* Top Navigation */}
      <DashboardNavbar />

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        {/* Welcome Section */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Powered by Google Gemini AI</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Create Your Custom Interview Plan
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Paste your target job posting and upload your resume or provide a background summary.
            HireNex leverages Gemini AI to evaluate your profile against role expectations,
            synthesizing targeted technical questions, behavioral STAR scenarios, and a custom
            7-day preparation roadmap.
          </p>
        </div>

        {/* Real Database Statistics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                Total Plans
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {stats.totalPlans}
              </span>
              <span className="text-[11px] text-slate-500 block">Saved in database</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 text-indigo-400 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 block mb-0.5">
                Completed
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                {stats.completedPlans}
              </span>
              <span className="text-[11px] text-slate-500 block">Ready to practice</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 block mb-0.5">
                Average Match
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-indigo-400">
                {stats.averageScore}%
              </span>
              <span className="text-[11px] text-slate-500 block">Candidate alignment</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-400 block mb-0.5">
                Questions Synthesized
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-violet-400">
                {stats.technicalQuestionsGenerated}
              </span>
              <span className="text-[11px] text-slate-500 block">Targeted technical Qs</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Large Two-Column Input Card Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch mb-8">
          {/* Left Column: Target Job Description */}
          <JobDescriptionInput
            value={jobDescription}
            onChange={(val) => {
              setJobDescription(val);
              if (errors.jobDescription) {
                setErrors((prev) => ({ ...prev, jobDescription: '' }));
              }
            }}
            error={errors.jobDescription}
          />

          {/* Right Column: Candidate Profile */}
          <CandidateProfileInput
            resumeFile={resumeFile}
            onResumeChange={(file) => {
              setResumeFile(file);
              if (errors.profile) {
                setErrors((prev) => ({ ...prev, profile: '' }));
              }
            }}
            selfDescription={selfDescription}
            onSelfDescriptionChange={(desc) => {
              setSelfDescription(desc);
              if (errors.profile) {
                setErrors((prev) => ({ ...prev, profile: '' }));
              }
            }}
            error={errors.profile}
          />
        </div>

        {/* Action Bar with Primary Generate Button */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>
              {isFormValid ? (
                <span className="text-emerald-400 font-medium">
                  Inputs verified. Ready to synthesize custom interview strategy with Gemini AI.
                </span>
              ) : (
                <span>
                  Please complete the job description and candidate profile above to enable generation.
                </span>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={handleGenerateStrategy}
            disabled={!isFormValid || isGenerating}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg ${
              isFormValid && !isGenerating
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30 active:scale-[0.98] cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-70 shadow-none'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Analyzing & Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Generate My Interview Strategy</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* AI Generation Loading Modal / Progress Overlay */}
        {isGenerating && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-750 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 animate-pulse" />

              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-600/20">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                Synthesizing Interview Strategy
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Analyzing your profile against the job requirements...
              </p>

              <div className="space-y-3 text-left">
                {GENERATION_STEPS.map((step, idx) => {
                  const isDone = idx < generationStep;
                  const isCurrent = idx === generationStep;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center space-x-3 text-xs transition-colors duration-200 ${
                        isDone
                          ? 'text-emerald-400'
                          : isCurrent
                          ? 'text-indigo-300 font-medium'
                          : 'text-slate-500'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                      )}
                      <span className="truncate">{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Real Backend Report History Section */}
        <RecentReports
          reports={reports}
          isLoading={isLoadingReports}
          error={reportsError}
          onRetry={() => {
            fetchReports();
            fetchStats();
          }}
          onDelete={(rep) => setReportToDelete(rep)}
        />
      </main>

      {/* Delete Confirmation Modal Dialog */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white text-center mb-2">
              Delete Interview Plan?
            </h3>

            <p className="text-xs text-slate-400 text-center leading-relaxed mb-6">
              Are you sure you want to delete the plan for{' '}
              <strong className="text-slate-200">{reportToDelete.jobTitle}</strong>
              {reportToDelete.companyName ? ` at ${reportToDelete.companyName}` : ''}? This action
              cannot be undone.
            </p>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 flex items-center justify-center space-x-1.5 transition-colors"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
