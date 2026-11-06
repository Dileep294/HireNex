import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  UploadCloud,
  FileCheck,
  Trash2,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  UserCheck,
  Code2,
} from 'lucide-react';
import apiClient from '../../api/apiClient';

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const CandidateProfileInput = ({
  resumeFile, // Object: { fileName, originalName, fileSize, extractedText, parsedData } or null
  onResumeChange,
  selfDescription,
  onSelfDescriptionChange,
  error,
}) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const uploadFileToBackend = async (file) => {
    setUploadError('');

    if (!file) return;

    // Client-side quick check
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      const msg = 'Only PDF files are accepted. Please select a valid .pdf file.';
      setUploadError(msg);
      toast.error(msg);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      const msg = 'File size exceeds 5 MB limit. Please select a smaller PDF.';
      setUploadError(msg);
      toast.error(msg);
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await apiClient.post('/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 90) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        },
      });

      setUploadProgress(100);

      if (response.data?.success && response.data?.data) {
        onResumeChange(response.data.data);
        toast.success('Resume parsed and verified successfully!');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Failed to upload and extract resume.';
      setUploadError(errorMsg);
      toast.error(errorMsg);
      onResumeChange(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFileToBackend(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFileToBackend(e.target.files[0]);
    }
  };

  const handleRemoveFile = async () => {
    if (resumeFile?.fileName) {
      try {
        await apiClient.delete(`/resumes/${resumeFile.fileName}`);
      } catch (err) {
        // Safe to ignore server cleanup error
      }
    }
    onResumeChange(null);
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Resume removed.');
  };

  const handleReplaceClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const hasProfile = Boolean(
    resumeFile || (selfDescription && selfDescription.trim().length >= 30)
  );

  return (
    <div className="flex flex-col h-full bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl shadow-black/20 hover:border-slate-750 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Candidate Profile
              </h2>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Resume or Summary
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload your resume as a PDF, or provide a summary of your professional background.
            </p>
          </div>
        </div>
      </div>

      {/* Info notice */}
      <div className="mb-4 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 flex items-start space-x-2.5 text-xs text-indigo-300">
        <Info className="w-4 h-4 flex-shrink-0 text-indigo-400 mt-0.5" />
        <span>
          <strong className="font-semibold text-indigo-200">Required:</strong> Upload your PDF
          resume (max 5 MB) or write a self-description below so the AI can extract your credentials.
        </span>
      </div>

      {/* Section 1: Resume Upload Area */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          disabled={isUploading}
          className="hidden"
          id="resume-upload-input"
        />

        {/* Uploading State */}
        {isUploading ? (
          <div className="border-2 border-indigo-500/60 bg-indigo-600/10 rounded-xl p-6 text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-white">Uploading & Parsing PDF...</p>
                <p className="text-xs text-indigo-300 mt-0.5">
                  Validating PDF signature and extracting sections
                </p>
              </div>
              <div className="w-full max-w-xs bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : !resumeFile ? (
          /* Drag & Drop Upload Zone */
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-150 ${
              dragActive
                ? 'border-indigo-500 bg-indigo-600/10'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60'
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-sm">
                <span className="font-medium text-indigo-400 hover:text-indigo-300">
                  Click to browse
                </span>{' '}
                <span className="text-slate-400">or drag and drop resume</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Supported format: <strong className="text-slate-300 font-medium">PDF only</strong> (Max 5 MB)
              </p>
            </div>
          </div>
        ) : (
          /* Successfully Uploaded & Parsed File Card */
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-750 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <p
                    className="text-sm font-medium text-slate-100 truncate"
                    title={resumeFile.originalName}
                  >
                    {resumeFile.originalName}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-0.5">
                    <span className="font-mono">{formatFileSize(resumeFile.fileSize)}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Text Extracted
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                <button
                  type="button"
                  onClick={handleReplaceClick}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Replace PDF"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Remove PDF"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Extracted Metadata Preview Pill */}
            {resumeFile.parsedData && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2 text-[11px] text-slate-300">
                {resumeFile.parsedData.name && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    <UserCheck className="w-3 h-3" />
                    <span>{resumeFile.parsedData.name}</span>
                  </span>
                )}
                {resumeFile.parsedData.email && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                    {resumeFile.parsedData.email}
                  </span>
                )}
                {resumeFile.parsedData.skills?.length > 0 && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <Code2 className="w-3 h-3" />
                    <span>{resumeFile.parsedData.skills.length} skills detected</span>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {uploadError && (
          <p className="mt-2 text-xs text-rose-400 font-medium flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{uploadError}</span>
          </p>
        )}
      </div>

      {/* Divider with OR */}
      <div className="relative my-2 text-center flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800" />
        </div>
        <span className="relative z-10 px-3 bg-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-500 rounded-full border border-slate-800">
          OR
        </span>
      </div>

      {/* Section 2: Self-Description Textarea */}
      <div className="flex-1 flex flex-col mt-2">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-slate-300">
            Candidate Self-Description / Experience Summary
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            {selfDescription.length} chars
          </span>
        </div>

        <textarea
          value={selfDescription}
          onChange={(e) => onSelfDescriptionChange(e.target.value)}
          placeholder="e.g. 5 years of software engineering experience specializing in React, Node.js and distributed cloud systems. Led architecture of high-traffic SaaS products, improved latency by 40%..."
          className="w-full flex-1 min-h-[140px] sm:min-h-[160px] p-3.5 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl text-slate-200 placeholder-slate-500 text-sm leading-relaxed resize-none focus:outline-none focus:ring-4 transition-all"
        />
      </div>

      {/* Profile validation footer */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1.5">
          {error ? (
            <span className="text-rose-400 flex items-center space-x-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </span>
          ) : hasProfile ? (
            <span className="text-emerald-400 flex items-center space-x-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {resumeFile ? 'Resume attached and parsed' : 'Candidate description provided'}
              </span>
            </span>
          ) : (
            <span className="text-slate-400">
              Attach a PDF or write at least 30 characters
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateProfileInput;
