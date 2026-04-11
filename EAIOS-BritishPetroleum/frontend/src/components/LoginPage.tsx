import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    // Simulate brief auth delay for UX
    setTimeout(() => {
      login(email.trim());
      navigate('/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-bp-dark flex flex-col items-center justify-center px-4">
      {/* Background grid decoration */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,163,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,163,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* BP Logo / Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-4">
            {/* BP Sun Logo SVG */}
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <circle cx="28" cy="28" r="28" fill="#00539f" />
              <circle cx="28" cy="28" r="19" fill="#ffffff" />
              <circle cx="28" cy="28" r="11" fill="#00a651" />
              {/* Rays */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <rect
                  key={i}
                  x="26.5"
                  y="3"
                  width="3"
                  height="8"
                  rx="1.5"
                  fill="#00539f"
                  transform={`rotate(${angle} 28 28)`}
                />
              ))}
            </svg>
          </div>
          <div className="text-xs font-semibold tracking-[0.3em] text-bp-green uppercase mb-1">
            British Petroleum
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Enterprise AI Operating System
          </h1>
          <p className="text-gray-400 text-sm mt-1">EAIOS — Secure Access Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-bp-surface border border-bp-border rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@bp.com"
                  autoComplete="email"
                  className="w-full bg-bp-card border border-bp-border rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-bp-blue focus:ring-1 focus:ring-bp-blue transition-colors"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="password">
                Password
                <span className="ml-2 text-xs text-gray-500 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-bp-card border border-bp-border rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-bp-blue focus:ring-1 focus:ring-bp-blue transition-colors"
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2.5">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-bp-blue hover:bg-[#0066cc] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  Sign in
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-600 mt-6">
            Authorised BP personnel only. All access is logged and monitored.
          </p>
        </div>

        {/* Bottom branding */}
        <p className="text-center text-xs text-gray-700 mt-6">
          © {new Date().getFullYear()} BP p.l.c. All rights reserved.
        </p>
      </div>
    </div>
  );
};
