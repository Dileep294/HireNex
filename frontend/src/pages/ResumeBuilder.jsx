import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  FileText,
  Download,
  Sparkles,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
  Target,
  Wand2,
  Check,
  Code,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Award,
  Lightbulb,
} from 'lucide-react';
import DashboardNavbar from '../components/dashboard/DashboardNavbar';
import apiClient from '../api/apiClient';

const INITIAL_RESUME_DATA = {
  template: 'modern',
  personalInfo: {
    fullName: 'Alex Morgan',
    jobTitle: 'Senior Full Stack Engineer',
    email: 'alex.morgan@example.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    linkedin: 'https://linkedin.com/in/alexmorgan-dev',
    github: 'https://github.com/alexmorgan-dev',
    portfolio: 'https://alexmorgan.dev',
  },
  summary:
    'Results-driven Senior Full Stack Engineer with 6+ years of experience designing high-throughput distributed microservices and reactive single-page applications. Proficient in React, Node.js, TypeScript, and cloud-native Kubernetes deployments with a proven record of improving system uptime and reducing latency.',
  skills: [
    'JavaScript (ES6+)',
    'TypeScript',
    'React',
    'Next.js',
    'Node.js',
    'Express',
    'GraphQL',
    'PostgreSQL',
    'MongoDB',
    'Redis',
    'Docker',
    'Kubernetes',
    'AWS (S3, ECS, Lambda)',
    'CI/CD Pipelines',
  ],
  experience: [
    {
      title: 'Senior Full Stack Engineer',
      company: 'TechWave Solutions',
      location: 'San Francisco, CA',
      startDate: '2022',
      endDate: '',
      current: true,
      highlights: [
        'Architected real-time analytics pipeline using Node.js and Redis, processing 15M daily events with sub-50ms latency.',
        'Migrated monolithic frontend to React and Tailwind CSS, improving Core Web Vitals and cutting initial bundle size by 42%.',
        'Spearheaded automated testing strategies with Jest and Cypress, elevating test coverage from 55% to 88%.',
      ],
    },
    {
      title: 'Software Engineer',
      company: 'DataStream Labs',
      location: 'San Jose, CA',
      startDate: '2019',
      endDate: '2022',
      current: false,
      highlights: [
        'Developed customer-facing dashboard features using React, TypeScript, and RESTful APIs serving 200k monthly active users.',
        'Optimized slow PostgreSQL queries and indexed database tables, reducing p99 API response times by 35%.',
        'Collaborated in agile 2-week sprints with product and UX teams to deliver 14 high-impact feature releases on schedule.',
      ],
    },
  ],
  education: [
    {
      degree: 'B.S. in Computer Science',
      institution: 'University of California, Berkeley',
      location: 'Berkeley, CA',
      startDate: '2015',
      endDate: '2019',
      gpa: '3.8',
      highlights: ['Dean’s Honors List (2017 - 2019)', 'ACM Student Chapter Lead'],
    },
  ],
  projects: [
    {
      name: 'CloudSync Distributed File Broker',
      techStack: ['Node.js', 'Go', 'Redis', 'Docker'],
      liveUrl: 'https://cloudsync-demo.dev',
      githubUrl: 'https://github.com/alexmorgan-dev/cloudsync',
      highlights: [
        'Engineered an open-source chunked file upload service with resumable multi-part transfers and SHA-256 integrity verification.',
        'Earned 450+ GitHub stars and adopted by 12 independent developer teams.',
      ],
    },
  ],
  certifications: [
    {
      name: 'AWS Certified Solutions Architect – Associate',
      issuer: 'Amazon Web Services',
      date: '2023',
      credentialUrl: '',
    },
  ],
};

export default function ResumeBuilder() {
  const [resumeData, setResumeData] = useState(INITIAL_RESUME_DATA);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview' (mobile toggle)
  const [isDownloading, setIsDownloading] = useState(false);
  const [isParsingResume, setIsParsingResume] = useState(false);

  // AI Optimizer state
  const [targetJobDescription, setTargetJobDescription] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiOptimization, setAiOptimization] = useState(null);

  // Accordion section collapse state
  const [collapsedSections, setCollapsedSections] = useState({
    personal: false,
    aiOptimize: false,
    summary: false,
    skills: false,
    experience: false,
    education: false,
    projects: false,
    certifications: false,
  });

  const fileInputRef = useRef(null);

  const toggleSection = (section) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Generic field update helper
  const updatePersonalInfo = (field, val) => {
    setResumeData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: val },
    }));
  };

  // Skills input helper (comma-separated string <-> array)
  const handleSkillsChange = (e) => {
    const raw = e.target.value;
    const items = raw.split(',').map((s) => s.trim()).filter(Boolean);
    setResumeData((prev) => ({ ...prev, skills: items }));
  };

  // Experience handlers
  const handleAddExperience = () => {
    setResumeData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          title: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          highlights: [''],
        },
      ],
    }));
  };

  const handleUpdateExperience = (idx, field, val) => {
    setResumeData((prev) => {
      const updated = [...prev.experience];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, experience: updated };
    });
  };

  const handleRemoveExperience = (idx) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx),
    }));
  };

  const handleAddExpHighlight = (expIdx) => {
    setResumeData((prev) => {
      const updated = [...prev.experience];
      updated[expIdx].highlights = [...(updated[expIdx].highlights || []), ''];
      return { ...prev, experience: updated };
    });
  };

  const handleUpdateExpHighlight = (expIdx, hIdx, val) => {
    setResumeData((prev) => {
      const updated = [...prev.experience];
      const highlights = [...(updated[expIdx].highlights || [])];
      highlights[hIdx] = val;
      updated[expIdx].highlights = highlights;
      return { ...prev, experience: updated };
    });
  };

  const handleRemoveExpHighlight = (expIdx, hIdx) => {
    setResumeData((prev) => {
      const updated = [...prev.experience];
      updated[expIdx].highlights = updated[expIdx].highlights.filter((_, i) => i !== hIdx);
      return { ...prev, experience: updated };
    });
  };

  // Education handlers
  const handleAddEducation = () => {
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          degree: '',
          institution: '',
          location: '',
          startDate: '',
          endDate: '',
          gpa: '',
          highlights: [],
        },
      ],
    }));
  };

  const handleUpdateEducation = (idx, field, val) => {
    setResumeData((prev) => {
      const updated = [...prev.education];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, education: updated };
    });
  };

  const handleRemoveEducation = (idx) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx),
    }));
  };

  // Project handlers
  const handleAddProject = () => {
    setResumeData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          name: '',
          techStack: [],
          liveUrl: '',
          githubUrl: '',
          highlights: [''],
        },
      ],
    }));
  };

  const handleUpdateProject = (idx, field, val) => {
    setResumeData((prev) => {
      const updated = [...prev.projects];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, projects: updated };
    });
  };

  const handleRemoveProject = (idx) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx),
    }));
  };

  const handleAddProjectHighlight = (projIdx) => {
    setResumeData((prev) => {
      const updated = [...prev.projects];
      updated[projIdx].highlights = [...(updated[projIdx].highlights || []), ''];
      return { ...prev, projects: updated };
    });
  };

  const handleUpdateProjectHighlight = (projIdx, hIdx, val) => {
    setResumeData((prev) => {
      const updated = [...prev.projects];
      const highlights = [...(updated[projIdx].highlights || [])];
      highlights[hIdx] = val;
      updated[projIdx].highlights = highlights;
      return { ...prev, projects: updated };
    });
  };

  const handleRemoveProjectHighlight = (projIdx, hIdx) => {
    setResumeData((prev) => {
      const updated = [...prev.projects];
      updated[projIdx].highlights = updated[projIdx].highlights.filter((_, i) => i !== hIdx);
      return { ...prev, projects: updated };
    });
  };

  // Certification handlers
  const handleAddCertification = () => {
    setResumeData((prev) => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        { name: '', issuer: '', date: '', credentialUrl: '' },
      ],
    }));
  };

  const handleUpdateCertification = (idx, field, val) => {
    setResumeData((prev) => {
      const updated = [...prev.certifications];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, certifications: updated };
    });
  };

  const handleRemoveCertification = (idx) => {
    setResumeData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== idx),
    }));
  };

  // Upload existing PDF resume to auto-fill form
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a valid PDF document.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    setIsParsingResume(true);
    try {
      const response = await apiClient.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.success && response.data?.data) {
        const extracted = response.data.data;
        const candidate = extracted.candidateData || {};

        setResumeData((prev) => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            fullName: candidate.name || prev.personalInfo.fullName,
            email: candidate.email || prev.personalInfo.email,
            phone: candidate.phone || prev.personalInfo.phone,
          },
          skills: candidate.skills && candidate.skills.length > 0 ? candidate.skills : prev.skills,
          summary: candidate.summary || prev.summary,
        }));

        toast.success('Resume parsed! Contact and skills updated in builder.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to parse resume PDF.');
    } finally {
      setIsParsingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // AI ATS Job Description Matcher
  const handleOptimizeWithAi = async () => {
    if (!targetJobDescription || targetJobDescription.trim().length < 20) {
      toast.error('Please paste a job description of at least 20 characters.');
      return;
    }

    setIsOptimizing(true);
    try {
      const response = await apiClient.post('/resumes/ai-optimize', {
        resumeData,
        jobDescription: targetJobDescription.trim(),
      });

      if (response.data?.success && response.data?.data) {
        setAiOptimization(response.data.data);
        toast.success('AI ATS analysis complete!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to analyze resume against job description.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Apply AI improved summary
  const handleApplyAiSummary = () => {
    if (aiOptimization?.improvedSummary) {
      setResumeData((prev) => ({ ...prev, summary: aiOptimization.improvedSummary }));
      toast.success('Applied AI-optimized summary to your resume!');
    }
  };

  // Download PDF from Backend via Puppeteer
  const handleDownloadPdf = async () => {
    if (!resumeData.personalInfo.fullName.trim()) {
      toast.error('Please enter your full name before downloading.');
      return;
    }

    setIsDownloading(true);
    try {
      const response = await apiClient.post(
        '/resumes/generate-pdf',
        { resumeData },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = resumeData.personalInfo.fullName.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.href = url;
      link.setAttribute('download', `${safeName}_HireNex_Resume.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('PDF Resume generated and downloaded!');
    } catch (err) {
      toast.error('Failed to generate PDF resume. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
      {/* Background Decorative Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.1),rgba(255,255,255,0))] pointer-events-none" />

      {/* Navigation Header */}
      <DashboardNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* Top Header & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
              <Link to="/dashboard" className="hover:text-white flex items-center space-x-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <span>/</span>
              <span className="text-indigo-400 font-medium">ATS Resume Builder</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-2.5">
              <span>AI-Powered ATS Resume Builder</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold uppercase tracking-wider">
                Phase 10
              </span>
            </h1>
          </div>

          {/* Action Buttons: Template Switcher & Download */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Upload Existing PDF Resume */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePdfUpload}
              accept=".pdf"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsingResume}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
              title="Upload an existing PDF resume to auto-fill"
            >
              {isParsingResume ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Parsing PDF...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Import PDF</span>
                </>
              )}
            </button>

            {/* Template Selector */}
            <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setResumeData((p) => ({ ...p, template: 'classic' }))}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  resumeData.template === 'classic'
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Classic ATS
              </button>
              <button
                type="button"
                onClick={() => setResumeData((p) => ({ ...p, template: 'modern' }))}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  resumeData.template === 'modern'
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Modern Pro
              </button>
              <button
                type="button"
                onClick={() => setResumeData((p) => ({ ...p, template: 'developer' }))}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  resumeData.template === 'developer'
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Software Dev
              </button>
            </div>

            {/* Download PDF Primary Action */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile View Toggle (Editor vs Preview) */}
        <div className="flex lg:hidden items-center justify-center p-1 bg-slate-900 border border-slate-800 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 ${
              activeTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Content</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 ${
              activeTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>
        </div>

        {/* 2-Column Split: Form Editor (Left) & Real-Time Live Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Editor (7 cols) */}
          <div className={`space-y-6 lg:col-span-7 ${activeTab === 'editor' ? 'block' : 'hidden lg:block'}`}>
            {/* 1. Target Job Description & AI ATS Matcher */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div
                onClick={() => toggleSection('aiOptimize')}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>Target Job Description & AI Optimizer</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                        Gemini AI
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Match keywords and improve wording without inventing unearned skills
                    </p>
                  </div>
                </div>
                <div className="p-1 rounded-lg text-slate-400">
                  {collapsedSections.aiOptimize ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
              </div>

              {!collapsedSections.aiOptimize && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                  <textarea
                    rows={4}
                    value={targetJobDescription}
                    onChange={(e) => setTargetJobDescription(e.target.value)}
                    placeholder="Paste the target job description here to extract ATS keywords and tailored phrasing..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {targetJobDescription.length} characters
                    </span>

                    <button
                      type="button"
                      onClick={handleOptimizeWithAi}
                      disabled={isOptimizing || targetJobDescription.trim().length < 20}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all shadow-md shadow-indigo-600/20"
                    >
                      {isOptimizing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Analyzing with Gemini...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Analyze & Match ATS Keywords</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* AI Results Card */}
                  {aiOptimization && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>ATS Compatibility Rating</span>
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {aiOptimization.atsScore}% Match
                        </span>
                      </div>

                      {/* Keywords Matched vs Missing */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] font-semibold text-emerald-400 block mb-1">
                            Matched Keywords ({aiOptimization.matchedKeywords.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {aiOptimization.matchedKeywords.map((k, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                {k}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-semibold text-amber-400 block mb-1">
                            Missing Keywords ({aiOptimization.missingKeywords.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {aiOptimization.missingKeywords.map((k, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                {k}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Improved Summary */}
                      {aiOptimization.improvedSummary && (
                        <div className="pt-2 border-t border-slate-900">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider">
                              AI Suggested Tailored Summary:
                            </span>
                            <button
                              type="button"
                              onClick={handleApplyAiSummary}
                              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Apply to Resume</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 leading-relaxed italic">
                            &quot;{aiOptimization.improvedSummary}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Personal Information */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div
                onClick={() => toggleSection('personal')}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-white">Personal Information</h2>
                </div>
                <div className="p-1 rounded-lg text-slate-400">
                  {collapsedSections.personal ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
              </div>

              {!collapsedSections.personal && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Full Name *</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.fullName}
                      onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Professional Title</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.jobTitle}
                      onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)}
                      placeholder="e.g. Senior Full Stack Engineer"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Email Address *</label>
                    <input
                      type="email"
                      value={resumeData.personalInfo.email}
                      onChange={(e) => updatePersonalInfo('email', e.target.value)}
                      placeholder="alex.morgan@example.com"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Phone Number</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.phone}
                      onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                      placeholder="+1 (555) 234-5678"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Location</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.location}
                      onChange={(e) => updatePersonalInfo('location', e.target.value)}
                      placeholder="San Francisco, CA"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">LinkedIn URL</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.linkedin}
                      onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/alexmorgan"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">GitHub URL</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.github}
                      onChange={(e) => updatePersonalInfo('github', e.target.value)}
                      placeholder="https://github.com/alexmorgan"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Portfolio / Website</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.portfolio}
                      onChange={(e) => updatePersonalInfo('portfolio', e.target.value)}
                      placeholder="https://alexmorgan.dev"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Professional Summary */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div
                onClick={() => toggleSection('summary')}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-white">Professional Summary</h2>
                </div>
                <div className="p-1 rounded-lg text-slate-400">
                  {collapsedSections.summary ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
              </div>

              {!collapsedSections.summary && (
                <div className="mt-4 pt-4 border-t border-slate-800/80">
                  <textarea
                    rows={4}
                    value={resumeData.summary}
                    onChange={(e) => setResumeData((p) => ({ ...p, summary: e.target.value }))}
                    placeholder="Briefly state your core background, technical domain, and quantifiable impact..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="text-right text-[11px] text-slate-500 mt-1">
                    {resumeData.summary.length} characters
                  </div>
                </div>
              )}
            </div>

            {/* 4. Technical Skills */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div
                onClick={() => toggleSection('skills')}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Code className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Technical Skills</h2>
                    <span className="text-[11px] text-slate-500">
                      {Array.isArray(resumeData.skills) ? resumeData.skills.length : 0} skills listed
                    </span>
                  </div>
                </div>
                <div className="p-1 rounded-lg text-slate-400">
                  {collapsedSections.skills ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
              </div>

              {!collapsedSections.skills && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                  <label className="block text-xs text-slate-400 font-medium">
                    Skills (Comma-separated list):
                  </label>
                  <textarea
                    rows={3}
                    value={Array.isArray(resumeData.skills) ? resumeData.skills.join(', ') : ''}
                    onChange={handleSkillsChange}
                    placeholder="React, TypeScript, Node.js, Express, PostgreSQL, Docker, AWS, GraphQL..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {Array.isArray(resumeData.skills) &&
                      resumeData.skills.map((s, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-mono"
                        >
                          {s}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Work Experience */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div
                onClick={() => toggleSection('experience')}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Work Experience</h2>
                    <span className="text-[11px] text-slate-500">
                      {resumeData.experience.length} positions
                    </span>
                  </div>
                </div>
                <div className="p-1 rounded-lg text-slate-400">
                  {collapsedSections.experience ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
              </div>

              {!collapsedSections.experience && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-6">
                  {resumeData.experience.map((exp, expIdx) => (
                    <div
                      key={expIdx}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 relative"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(expIdx)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-rose-400 p-1"
                        title="Remove position"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-400 mb-1 font-medium">Job Title</label>
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => handleUpdateExperience(expIdx, 'title', e.target.value)}
                            placeholder="e.g. Senior Software Engineer"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1 font-medium">Company</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => handleUpdateExperience(expIdx, 'company', e.target.value)}
                            placeholder="e.g. Acme Corp"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1 font-medium">Location</label>
                          <input
                            type="text"
                            value={exp.location}
                            onChange={(e) => handleUpdateExperience(expIdx, 'location', e.target.value)}
                            placeholder="e.g. New York, NY"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="flex-1">
                            <label className="block text-slate-400 mb-1 font-medium">Start Date</label>
                            <input
                              type="text"
                              value={exp.startDate}
                              onChange={(e) => handleUpdateExperience(expIdx, 'startDate', e.target.value)}
                              placeholder="e.g. 2021"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                            />
                          </div>

                          <div className="flex-1">
                            <label className="block text-slate-400 mb-1 font-medium">End Date</label>
                            <input
                              type="text"
                              value={exp.current ? 'Present' : exp.endDate}
                              disabled={exp.current}
                              onChange={(e) => handleUpdateExperience(expIdx, 'endDate', e.target.value)}
                              placeholder="e.g. 2023"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-slate-400">
                        <input
                          type="checkbox"
                          id={`current-${expIdx}`}
                          checked={exp.current}
                          onChange={(e) => handleUpdateExperience(expIdx, 'current', e.target.checked)}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                        />
                        <label htmlFor={`current-${expIdx}`} className="cursor-pointer">
                          I currently work in this role
                        </label>
                      </div>

                      {/* Bullet points */}
                      <div className="space-y-2 pt-2">
                        <label className="block text-xs font-semibold text-slate-300">
                          Key Achievements & Responsibilities:
                        </label>
                        {exp.highlights?.map((hl, hIdx) => (
                          <div key={hIdx} className="flex items-center space-x-2">
                            <span className="text-slate-500 text-xs">•</span>
                            <input
                              type="text"
                              value={hl}
                              onChange={(e) => handleUpdateExpHighlight(expIdx, hIdx, e.target.value)}
                              placeholder="Led engineering team of 5, delivering microservices with 99.9% uptime..."
                              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveExpHighlight(expIdx, hIdx)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddExpHighlight(expIdx)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1 pt-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Achievement Bullet</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddExperience}
                    className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 text-xs font-semibold text-slate-300 hover:text-indigo-400 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Work Experience Entry</span>
                  </button>
                </div>
              )}
            </div>

            {/* 6. Technical Projects */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div
                onClick={() => toggleSection('projects')}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Technical Projects</h2>
                    <span className="text-[11px] text-slate-500">
                      {resumeData.projects.length} projects
                    </span>
                  </div>
                </div>
                <div className="p-1 rounded-lg text-slate-400">
                  {collapsedSections.projects ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
              </div>

              {!collapsedSections.projects && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-5">
                  {resumeData.projects.map((proj, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 relative"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveProject(pIdx)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-400 mb-1 font-medium">Project Name</label>
                          <input
                            type="text"
                            value={proj.name}
                            onChange={(e) => handleUpdateProject(pIdx, 'name', e.target.value)}
                            placeholder="e.g. Distributed Task Queue"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1 font-medium">Tech Stack (comma-separated)</label>
                          <input
                            type="text"
                            value={Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack}
                            onChange={(e) =>
                              handleUpdateProject(
                                pIdx,
                                'techStack',
                                e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                              )
                            }
                            placeholder="e.g. React, Node.js, Redis"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1 font-medium">Live URL / Demo</label>
                          <input
                            type="text"
                            value={proj.liveUrl}
                            onChange={(e) => handleUpdateProject(pIdx, 'liveUrl', e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1 font-medium">GitHub / Source URL</label>
                          <input
                            type="text"
                            value={proj.githubUrl}
                            onChange={(e) => handleUpdateProject(pIdx, 'githubUrl', e.target.value)}
                            placeholder="https://github.com/..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                          />
                        </div>
                      </div>

                      {/* Bullets */}
                      <div className="space-y-2 pt-1">
                        <label className="block text-xs font-semibold text-slate-300">
                          Description & Impact:
                        </label>
                        {proj.highlights?.map((hl, hIdx) => (
                          <div key={hIdx} className="flex items-center space-x-2">
                            <span className="text-slate-500 text-xs">•</span>
                            <input
                              type="text"
                              value={hl}
                              onChange={(e) => handleUpdateProjectHighlight(pIdx, hIdx, e.target.value)}
                              placeholder="Implemented consensus protocol with automatic failover..."
                              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveProjectHighlight(pIdx, hIdx)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddProjectHighlight(pIdx)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Project Bullet</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddProject}
                    className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 text-xs font-semibold text-slate-300 hover:text-indigo-400 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project Entry</span>
                  </button>
                </div>
              )}
            </div>

            {/* 7. Education */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div
                onClick={() => toggleSection('education')}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Education</h2>
                    <span className="text-[11px] text-slate-500">
                      {resumeData.education.length} degrees
                    </span>
                  </div>
                </div>
                <div className="p-1 rounded-lg text-slate-400">
                  {collapsedSections.education ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
              </div>

              {!collapsedSections.education && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4">
                  {resumeData.education.map((edu, eduIdx) => (
                    <div
                      key={eduIdx}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 relative"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveEducation(eduIdx)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-400 mb-1 font-medium">Degree / Field</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => handleUpdateEducation(eduIdx, 'degree', e.target.value)}
                            placeholder="e.g. B.S. in Computer Science"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1 font-medium">Institution</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => handleUpdateEducation(eduIdx, 'institution', e.target.value)}
                            placeholder="e.g. UC Berkeley"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1 font-medium">Graduation Year / Dates</label>
                          <input
                            type="text"
                            value={edu.endDate}
                            onChange={(e) => handleUpdateEducation(eduIdx, 'endDate', e.target.value)}
                            placeholder="e.g. 2019"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1 font-medium">GPA / Honors (optional)</label>
                          <input
                            type="text"
                            value={edu.gpa}
                            onChange={(e) => handleUpdateEducation(eduIdx, 'gpa', e.target.value)}
                            placeholder="e.g. 3.8 / Cum Laude"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddEducation}
                    className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 text-xs font-semibold text-slate-300 hover:text-indigo-400 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Education Entry</span>
                  </button>
                </div>
              )}
            </div>

            {/* 8. Certifications */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div
                onClick={() => toggleSection('certifications')}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Certifications & Credentials</h2>
                    <span className="text-[11px] text-slate-500">
                      {resumeData.certifications.length} credentials
                    </span>
                  </div>
                </div>
                <div className="p-1 rounded-lg text-slate-400">
                  {collapsedSections.certifications ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
              </div>

              {!collapsedSections.certifications && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4">
                  {resumeData.certifications.map((cert, cIdx) => (
                    <div
                      key={cIdx}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 relative"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveCertification(cIdx)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="sm:col-span-2">
                          <label className="block text-slate-400 mb-1 font-medium">Certification Name</label>
                          <input
                            type="text"
                            value={cert.name}
                            onChange={(e) => handleUpdateCertification(cIdx, 'name', e.target.value)}
                            placeholder="e.g. AWS Solutions Architect"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1 font-medium">Year / Date</label>
                          <input
                            type="text"
                            value={cert.date}
                            onChange={(e) => handleUpdateCertification(cIdx, 'date', e.target.value)}
                            placeholder="e.g. 2023"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddCertification}
                    className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 text-xs font-semibold text-slate-300 hover:text-indigo-400 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Certification Entry</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Real-Time Live Preview (5 cols) */}
          <div className={`lg:col-span-5 sticky top-24 ${activeTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-white">Live Resume Preview</span>
                <span className="text-[10px] text-slate-400 uppercase font-mono px-2 py-0.5 rounded bg-slate-800">
                  {resumeData.template}
                </span>
              </div>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>

            {/* Paper Container Preview */}
            <div
              className={`rounded-xl shadow-2xl p-6 sm:p-7 overflow-y-auto max-h-[80vh] border transition-all ${
                resumeData.template === 'classic'
                  ? 'bg-white text-gray-900 font-serif border-gray-300'
                  : resumeData.template === 'developer'
                  ? 'bg-white text-slate-900 font-sans border-slate-300'
                  : 'bg-white text-slate-900 font-sans border-slate-300'
              }`}
              style={{ minHeight: '600px' }}
            >
              {/* Header */}
              <div
                className={`text-center pb-3 mb-4 ${
                  resumeData.template === 'modern'
                    ? 'border-b-2 border-indigo-600 text-left'
                    : resumeData.template === 'developer'
                    ? 'border-b border-slate-900 text-left'
                    : 'border-b border-gray-900'
                }`}
              >
                <h1
                  className={`font-bold tracking-tight text-slate-900 ${
                    resumeData.template === 'classic'
                      ? 'text-xl uppercase font-serif'
                      : resumeData.template === 'developer'
                      ? 'text-xl font-mono'
                      : 'text-2xl font-sans'
                  }`}
                >
                  {resumeData.personalInfo.fullName || 'Candidate Name'}
                </h1>

                {resumeData.personalInfo.jobTitle && (
                  <div
                    className={`text-xs mt-0.5 ${
                      resumeData.template === 'developer'
                        ? 'font-mono text-blue-600 font-semibold'
                        : resumeData.template === 'modern'
                        ? 'text-indigo-600 font-semibold'
                        : 'text-gray-600 italic'
                    }`}
                  >
                    {resumeData.template === 'developer'
                      ? `<${resumeData.personalInfo.jobTitle} />`
                      : resumeData.personalInfo.jobTitle}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-gray-600 mt-2">
                  {resumeData.personalInfo.email && <span>{resumeData.personalInfo.email}</span>}
                  {resumeData.personalInfo.phone && <span>• {resumeData.personalInfo.phone}</span>}
                  {resumeData.personalInfo.location && <span>• {resumeData.personalInfo.location}</span>}
                  {resumeData.personalInfo.linkedin && <span>• LinkedIn</span>}
                  {resumeData.personalInfo.github && <span>• GitHub</span>}
                  {resumeData.personalInfo.portfolio && <span>• Portfolio</span>}
                </div>
              </div>

              {/* Summary */}
              {resumeData.summary && (
                <div className="mb-4">
                  <h3
                    className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                      resumeData.template === 'modern'
                        ? 'text-indigo-700 border-b border-indigo-100 pb-0.5'
                        : resumeData.template === 'developer'
                        ? 'font-mono text-slate-900 border-b border-slate-200'
                        : 'text-gray-900 border-b border-gray-900'
                    }`}
                  >
                    {resumeData.template === 'developer' ? '// Technical Summary' : 'Professional Summary'}
                  </h3>
                  <p className="text-[10px] text-gray-700 leading-relaxed text-justify">
                    {resumeData.summary}
                  </p>
                </div>
              )}

              {/* Skills */}
              {Array.isArray(resumeData.skills) && resumeData.skills.length > 0 && (
                <div className="mb-4">
                  <h3
                    className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                      resumeData.template === 'modern'
                        ? 'text-indigo-700 border-b border-indigo-100 pb-0.5'
                        : resumeData.template === 'developer'
                        ? 'font-mono text-slate-900 border-b border-slate-200'
                        : 'text-gray-900 border-b border-gray-900'
                    }`}
                  >
                    {resumeData.template === 'developer' ? '// Technical Skills' : 'Technical Skills'}
                  </h3>
                  <p className="text-[10px] text-gray-700 leading-relaxed font-mono">
                    {resumeData.skills.join(', ')}
                  </p>
                </div>
              )}

              {/* Work Experience */}
              {resumeData.experience.length > 0 && (
                <div className="mb-4">
                  <h3
                    className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                      resumeData.template === 'modern'
                        ? 'text-indigo-700 border-b border-indigo-100 pb-0.5'
                        : resumeData.template === 'developer'
                        ? 'font-mono text-slate-900 border-b border-slate-200'
                        : 'text-gray-900 border-b border-gray-900'
                    }`}
                  >
                    {resumeData.template === 'developer' ? '// Engineering Experience' : 'Experience'}
                  </h3>
                  <div className="space-y-2.5">
                    {resumeData.experience.map((exp, i) => (
                      <div key={i} className="text-[10px]">
                        <div className="flex justify-between items-baseline font-semibold text-gray-900">
                          <span>
                            {exp.title}
                            {exp.company ? ` • ${exp.company}` : ''}
                          </span>
                          <span className="text-[9px] text-gray-500 font-mono">
                            {exp.startDate} {exp.startDate && (exp.endDate || exp.current) ? '-' : ''}{' '}
                            {exp.current ? 'Present' : exp.endDate}
                          </span>
                        </div>
                        {exp.highlights?.filter(Boolean).length > 0 && (
                          <ul className="list-disc list-inside text-gray-700 mt-1 space-y-0.5 text-[9.5px]">
                            {exp.highlights.filter(Boolean).map((hl, hIdx) => (
                              <li key={hIdx}>{hl}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {resumeData.projects.length > 0 && (
                <div className="mb-4">
                  <h3
                    className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                      resumeData.template === 'modern'
                        ? 'text-indigo-700 border-b border-indigo-100 pb-0.5'
                        : resumeData.template === 'developer'
                        ? 'font-mono text-slate-900 border-b border-slate-200'
                        : 'text-gray-900 border-b border-gray-900'
                    }`}
                  >
                    {resumeData.template === 'developer' ? '// Open Source & Projects' : 'Key Projects'}
                  </h3>
                  <div className="space-y-2">
                    {resumeData.projects.map((proj, i) => (
                      <div key={i} className="text-[10px]">
                        <div className="flex justify-between items-baseline font-semibold text-gray-900">
                          <span>{proj.name}</span>
                          {Array.isArray(proj.techStack) && proj.techStack.length > 0 && (
                            <span className="text-[9px] text-indigo-600 font-mono">
                              [{proj.techStack.join(', ')}]
                            </span>
                          )}
                        </div>
                        {proj.highlights?.filter(Boolean).length > 0 && (
                          <ul className="list-disc list-inside text-gray-700 mt-0.5 space-y-0.5 text-[9.5px]">
                            {proj.highlights.filter(Boolean).map((hl, hIdx) => (
                              <li key={hIdx}>{hl}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {resumeData.education.length > 0 && (
                <div className="mb-3">
                  <h3
                    className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${
                      resumeData.template === 'modern'
                        ? 'text-indigo-700 border-b border-indigo-100 pb-0.5'
                        : resumeData.template === 'developer'
                        ? 'font-mono text-slate-900 border-b border-slate-200'
                        : 'text-gray-900 border-b border-gray-900'
                    }`}
                  >
                    Education
                  </h3>
                  {resumeData.education.map((edu, i) => (
                    <div key={i} className="text-[10px] mb-1.5">
                      <div className="flex justify-between items-baseline font-semibold text-gray-900">
                        <span>
                          {edu.degree}
                          {edu.institution ? ` • ${edu.institution}` : ''}
                        </span>
                        <span className="text-[9px] text-gray-500 font-mono">{edu.endDate}</span>
                      </div>
                      {edu.gpa && <div className="text-[9px] text-gray-600">GPA: {edu.gpa}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Certifications */}
              {resumeData.certifications.length > 0 && (
                <div>
                  <h3
                    className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                      resumeData.template === 'modern'
                        ? 'text-indigo-700 border-b border-indigo-100 pb-0.5'
                        : resumeData.template === 'developer'
                        ? 'font-mono text-slate-900 border-b border-slate-200'
                        : 'text-gray-900 border-b border-gray-900'
                    }`}
                  >
                    Certifications
                  </h3>
                  {resumeData.certifications.map((c, i) => (
                    <div key={i} className="text-[10px] flex justify-between text-gray-800">
                      <span>{c.name}</span>
                      <span className="text-[9px] text-gray-500 font-mono">{c.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
