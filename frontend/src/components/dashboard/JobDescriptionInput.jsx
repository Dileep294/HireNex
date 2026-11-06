import React from 'react';
import { Briefcase, AlertCircle, FileText, CheckCircle2, RotateCcw } from 'lucide-react';

const MAX_CHAR_COUNT = 10000;
const MIN_CHAR_COUNT = 50;

const SAMPLE_JOB_DESCRIPTION = `Role: Senior Full-Stack Engineer (MERN)
Company: TechCorp Innovations
Location: Remote / Hybrid

Key Responsibilities:
• Architect, build, and maintain scalable web applications utilizing React 18+, Node.js, Express, and MongoDB.
• Design robust RESTful and GraphQL APIs with strict data validation, JWT/cookie-based security, and rate limiting.
• Optimize application performance, database queries (indexing, aggregation pipelines), and frontend rendering.
• Collaborate with cross-functional teams including product managers, UI/UX designers, and QA engineers.
• Write clean, testable, and well-documented modular code with comprehensive unit and integration tests.

Required Qualifications:
• 4+ years of professional full-stack development experience with the MERN stack.
• Strong proficiency in JavaScript (ES6+), TypeScript, React, Express.js, and MongoDB/Mongoose.
• Deep understanding of asynchronous programming, state management, and modern CSS frameworks (Tailwind CSS).
• Experience deploying and monitoring cloud-native web services and CI/CD pipelines.`;

const JobDescriptionInput = ({ value, onChange, error }) => {
  const charCount = value.length;
  const isSatisfied = charCount >= MIN_CHAR_COUNT;

  const handlePasteSample = () => {
    onChange(SAMPLE_JOB_DESCRIPTION);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl shadow-black/20 relative group hover:border-slate-750 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Target Job Description
              </h2>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Required
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Paste the complete job posting, key responsibilities and qualifications.
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center space-x-2">
          {value ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
              title="Clear text"
            >
              Clear
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePasteSample}
              className="inline-flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all font-medium"
            >
              <FileText className="w-3 h-3" />
              <span>Paste Sample</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative flex-1 flex flex-col">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={MAX_CHAR_COUNT}
          placeholder="e.g. paste full job description here including required technical skills, years of experience, primary responsibilities and tools..."
          className={`w-full flex-1 min-h-[300px] sm:min-h-[380px] p-4 bg-slate-950/70 border ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
          } rounded-xl text-slate-200 placeholder-slate-500 text-sm leading-relaxed resize-none focus:outline-none focus:ring-4 transition-all`}
        />

        {/* Textarea Footer: Validation status & Character Counter */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            {error ? (
              <span className="text-rose-400 flex items-center space-x-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </span>
            ) : isSatisfied ? (
              <span className="text-emerald-400 flex items-center space-x-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Job description meets length criteria</span>
              </span>
            ) : (
              <span className="text-slate-400">
                Minimum {MIN_CHAR_COUNT} characters recommended
              </span>
            )}
          </div>

          <div
            className={`font-mono text-xs ${
              charCount >= MAX_CHAR_COUNT - 500
                ? 'text-amber-400'
                : 'text-slate-400'
            }`}
          >
            {charCount.toLocaleString()} / {MAX_CHAR_COUNT.toLocaleString()} chars
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDescriptionInput;

