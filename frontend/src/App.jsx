import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingFallback from './components/common/LoadingFallback';

// Route-level code splitting for enhanced performance and reduced initial bundle
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyReports = lazy(() => import('./pages/MyReports'));
const InterviewReport = lazy(() => import('./pages/InterviewReport'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #1e293b',
                fontSize: '13px',
                borderRadius: '12px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#0f172a',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#0f172a',
                },
              },
            }}
          />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public landing */}
              <Route path="/" element={<Home />} />

              {/* Guest-only routes (redirects to /dashboard if logged in) */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
              </Route>

              {/* Protected routes (redirects to /login if unauthenticated) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/reports" element={<MyReports />} />
                <Route path="/reports/:id" element={<InterviewReport />} />
                <Route path="/report/:id" element={<InterviewReport />} />
                <Route path="/resume-builder" element={<ResumeBuilder />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
