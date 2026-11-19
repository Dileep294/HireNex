import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Circle,
  BrainCircuit,
  Target,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─── Password strength calculator ─── */
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Very Weak', color: 'bg-rose-500' };
  if (score === 2) return { score, label: 'Weak', color: 'bg-orange-500' };
  if (score === 3) return { score, label: 'Fair', color: 'bg-amber-400' };
  if (score === 4) return { score, label: 'Strong', color: 'bg-emerald-500' };
  return { score, label: 'Very Strong', color: 'bg-emerald-400' };
};

/* ─── Password requirement row ─── */
const Requirement = ({ met, text }) => (
  <li className={`flex items-center gap-1.5 text-xs transition-colors ${met ? 'text-emerald-400' : 'text-slate-500'}`}>
    {met ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> : <Circle className="w-3 h-3 flex-shrink-0" />}
    {text}
  </li>
);

/* ─── Left-panel highlights ─── */
const HIGHLIGHTS = [
  { icon: BrainCircuit, label: 'Smart Resume Analysis', desc: 'AI extracts your skills automatically' },
  { icon: Target, label: 'Role-Specific Prep', desc: 'Custom questions for every job posting' },
  { icon: BarChart3, label: 'Track Your Progress', desc: 'Dashboard with match scores & history' },
];

const Signup = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const strength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  /* ─── Validation (mirrors backend rules) ─── */
  const validate = () => {
    const newErrors = {};
    const usernameTrimmed = formData.username.trim();
    if (!usernameTrimmed) {
      newErrors.username = 'Username is required';
    } else if (usernameTrimmed.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (usernameTrimmed.length > 30) {
      newErrors.username = 'Username cannot exceed 30 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(usernameTrimmed)) {
      newErrors.username = 'Only letters, numbers and underscores allowed';
    }

    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
    const res = await register({
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    });
    setSubmitting(false);
    if (res?.success) {
      navigate('/dashboard', { replace: true });
    } else if (res?.error) {
      setApiError(res.error);
    }
  };

  /* ─── Reusable input class builder ─── */
  const inputClass = (fieldName, withPadRight = false) =>
    [
      'w-full pl-10 py-3 bg-white/5 border rounded-xl text-slate-100 placeholder-slate-500 text-sm transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:bg-white/8',
      withPadRight ? 'pr-11' : 'pr-4',
      errors[fieldName]
        ? 'border-rose-500/50 focus:ring-rose-500/30 focus:border-rose-500/60'
        : 'border-white/10 focus:ring-indigo-500/40 focus:border-indigo-500/60',
    ].join(' ');

  return (
    <div className="min-h-screen bg-slate-950 flex overflow-hidden">
      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-slate-950 to-indigo-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_15%,rgba(139,92,246,0.25),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_85%,rgba(99,102,241,0.18),transparent_55%)]" />

        {/* Orbs */}
        <div className="absolute top-20 right-10 w-80 h-80 bg-violet-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute bottom-24 left-6 w-64 h-64 bg-indigo-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '2s' }} />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Top logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">HireNex</span>
          </Link>
        </div>

        {/* Middle copy */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              Free to get started
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Land your<br />
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                dream job faster.
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              Join thousands of candidates who aced their interviews with HireNex AI.
            </p>
          </div>

          <div className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4 group">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/25 transition-colors">
                  <Icon className="w-4 h-4 text-violet-400" />
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
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 sm:px-10 lg:px-16 relative overflow-y-auto">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(139,92,246,0.07),transparent)] pointer-events-none lg:hidden" />

        <div className="relative w-full max-w-sm xl:max-w-md">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">HireNex</span>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-3xl font-bold text-white tracking-tight">Create Your HireNex Account</h2>
            <p className="mt-2 text-slate-400 text-sm leading-relaxed">
              Start preparing smarter and land your dream job.
            </p>
          </div>

          {/* API error */}
          {apiError && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              <span className="mt-0.5">⚠</span>
              <span>{apiError}</span>
            </div>
          )}

          {/* Form card */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl shadow-black/50">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="johndoe"
                    className={inputClass('username')}
                  />
                </div>
                {errors.username ? (
                  <p className="mt-1.5 text-xs text-rose-400 font-medium flex items-center gap-1"><span>⚠</span>{errors.username}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-600">3–30 characters, letters, numbers, underscores</p>
                )}
              </div>

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
                    className={inputClass('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-rose-400 font-medium flex items-center gap-1"><span>⚠</span>{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    className={inputClass('password', true)}
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

                {/* Strength bar */}
                {formData.password && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength.score ? strength.color : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">
                      Strength:{' '}
                      <span className={
                        strength.score <= 2 ? 'text-rose-400' :
                        strength.score === 3 ? 'text-amber-400' : 'text-emerald-400'
                      }>
                        {strength.label}
                      </span>
                    </p>
                  </div>
                )}

                {errors.password && (
                  <p className="mt-1.5 text-xs text-rose-400 font-medium flex items-center gap-1"><span>⚠</span>{errors.password}</p>
                )}

                {/* Requirements checklist */}
                {formData.password && (
                  <ul className="mt-2 space-y-1 pl-0.5">
                    <Requirement met={formData.password.length >= 6} text="At least 6 characters" />
                    <Requirement met={/[A-Z]/.test(formData.password)} text="One uppercase letter (optional)" />
                    <Requirement met={/[0-9]/.test(formData.password)} text="One number (optional)" />
                  </ul>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className={inputClass('confirmPassword', true)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Match indicator */}
                {formData.confirmPassword && (
                  <p className={`mt-1.5 text-xs font-medium flex items-center gap-1 ${
                    formData.password === formData.confirmPassword ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {formData.password === formData.confirmPassword ? (
                      <><CheckCircle2 className="w-3 h-3" /> Passwords match</>
                    ) : (
                      <><span>⚠</span> Passwords do not match</>
                    )}
                  </p>
                )}

                {errors.confirmPassword && !formData.confirmPassword && (
                  <p className="mt-1.5 text-xs text-rose-400 font-medium flex items-center gap-1">
                    <span>⚠</span>{errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="relative w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-violet-600/30"
                style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)' }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
                <span className="relative flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Account…
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>

          {/* Footer link */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors underline-offset-2 hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
