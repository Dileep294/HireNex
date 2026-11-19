import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─── Static feature highlights shown beside the form ─── */
const FEATURES = [
  { icon: Zap, label: 'AI-Powered Analysis', desc: 'Instant match scoring & strategy' },
  { icon: Trophy, label: 'Interview Mastery', desc: '15 technical + 10 behavioral Q&As' },
  { icon: ShieldCheck, label: 'Secure & Private', desc: 'Your data never leaves our servers' },
];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  /* ─── Validation ─── */
  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setApiError('');
    const res = await login({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    });
    setSubmitting(false);
    if (res?.success) {
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } else if (res?.error) {
      setApiError(res.error);
    }
  };

  /* ─── Input base classes ─── */
  const inputBase =
    'w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-slate-100 placeholder-slate-500 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:bg-white/8';
  const inputNormal = 'border-white/10 focus:ring-indigo-500/40 focus:border-indigo-500/60';
  const inputError = 'border-rose-500/50 focus:ring-rose-500/30 focus:border-rose-500/60';

  return (
    <div className="min-h-screen bg-slate-950 flex overflow-hidden">
      {/* ── Left decorative panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-violet-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.25),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(139,92,246,0.18),transparent_55%)]" />

        {/* Decorative orbs */}
        <div className="absolute top-24 left-16 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-32 right-8 w-56 h-56 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">HireNex</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              AI-Powered Interview Prep
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Your next offer<br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                starts here.
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              Get a personalised interview strategy built by AI in under 2 minutes.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4 group">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/25 transition-colors">
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} HireNex · AI-Powered Career Platform
          </p>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 sm:px-10 lg:px-16 relative">
        {/* Subtle radial on mobile */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(99,102,241,0.08),transparent)] pointer-events-none lg:hidden" />

        <div className="relative w-full max-w-sm xl:max-w-md">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">HireNex</span>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back!</h2>
            <p className="mt-2 text-slate-400 text-sm leading-relaxed">
              Continue your journey towards interview success.
            </p>
          </div>

          {/* API error banner */}
          {apiError && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <span className="text-rose-400 mt-0.5">⚠</span>
              <span>{apiError}</span>
            </div>
          )}

          {/* Form card */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl shadow-black/50">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-rose-400 font-medium flex items-center gap-1">
                    <span>⚠</span> {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`${inputBase} pr-11 ${errors.password ? inputError : inputNormal}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-rose-400 font-medium flex items-center gap-1">
                    <span>⚠</span> {errors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="relative w-full mt-1 py-3 px-4 rounded-xl font-semibold text-sm text-white overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-600/30"
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
              >
                {/* Hover shimmer */}
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
                <span className="relative flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>

          {/* Footer link */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors underline-offset-2 hover:underline"
            >
              Create one for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
