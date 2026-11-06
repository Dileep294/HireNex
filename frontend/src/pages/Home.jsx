import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Shield,
  Bot,
  FileText,
} from 'lucide-react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  const [backendStatus, setBackendStatus] = useState({
    loading: false,
    checked: false,
    online: false,
    data: null,
    error: null,
  });

  const checkBackendHealth = async () => {
    setBackendStatus((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await apiClient.get('/health');
      setBackendStatus({
        loading: false,
        checked: true,
        online: true,
        data: res.data,
        error: null,
      });
    } catch (err) {
      setBackendStatus({
        loading: false,
        checked: true,
        online: false,
        data: null,
        error: err.message || 'Failed to connect to backend',
      });
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-20 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">HireNex</span>
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center space-x-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-16 text-center flex flex-col items-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Next-Gen Full-Stack AI Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          Master Your Next Tech Interview with{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            AI-Driven Coaching
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          HireNex empowers candidates with real-time AI interview simulations, intelligent resume
          evaluations, and deep technical assessments built with modern MERN architecture.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link
            to={user ? '/dashboard' : '/signup'}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
          >
            <span>{user ? 'Open Dashboard' : 'Get Started Free'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-medium transition-colors"
          >
            {user ? 'Signed In as ' + user.username : 'Sign In to Account'}
          </Link>
        </div>

        {/* Features Preview */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200 mb-1">JWT & Cookie Auth</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Secure HTTP-only cookies, password hashing with bcryptjs, and route protection.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center mb-4">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200 mb-1">Gemini AI Engine</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Official @google/genai SDK configured for high-fidelity technical question generation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200 mb-1">Resume & Report Parser</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Multer, pdf-parse, and Puppeteer stack for extracting resumes and generating performance PDFs.
            </p>
          </div>
        </div>

        {/* Health Check Pill */}
        <div className="mt-12 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 max-w-md w-full flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-400">Backend API:</span>
            {backendStatus.loading ? (
              <span className="text-yellow-400 flex items-center">
                <RefreshCw className="w-3 h-3 animate-spin mr-1" /> Checking...
              </span>
            ) : backendStatus.online ? (
              <span className="text-emerald-400 font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Online ({backendStatus.data?.database?.status || 'ready'})
              </span>
            ) : (
              <span className="text-rose-400 flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> Offline
              </span>
            )}
          </div>
          <button
            onClick={checkBackendHealth}
            disabled={backendStatus.loading}
            className="text-slate-400 hover:text-indigo-400 transition-colors"
            title="Refresh status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${backendStatus.loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        HireNex © {new Date().getFullYear()} — Full-Stack AI Interview Preparation Platform
      </footer>
    </div>
  );
};

export default Home;

