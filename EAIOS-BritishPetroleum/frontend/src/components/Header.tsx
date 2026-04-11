import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  const loginDate = user?.loginTime
    ? new Date(user.loginTime).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <header className="bg-bp-navy border-b border-bp-border sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Left — BP Logo + Title */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <svg width="36" height="36" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="28" fill="#00539f" />
            <circle cx="28" cy="28" r="19" fill="#ffffff" />
            <circle cx="28" cy="28" r="11" fill="#00a651" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <rect
                key={i}
                x="26.5" y="3" width="3" height="8" rx="1.5"
                fill="#00539f"
                transform={`rotate(${angle} 28 28)`}
              />
            ))}
          </svg>
          <div>
            <div className="text-white font-bold text-sm leading-tight tracking-wide">
              EAIOS
            </div>
            <div className="text-gray-400 text-xs leading-tight hidden sm:block">
              Enterprise AI Operating System
            </div>
          </div>
        </div>

        {/* Centre — System label */}
        <div className="hidden md:flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-bp-green/10 border border-bp-green/30 text-bp-green text-xs font-medium px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-bp-green rounded-full animate-pulse" />
            System Operational
          </span>
        </div>

        {/* Right — User dropdown */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2.5 bg-bp-surface hover:bg-bp-card border border-bp-border rounded-xl px-3 py-2 transition-colors"
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-bp-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-white text-xs font-medium leading-tight truncate max-w-[160px]">
                {user?.email ?? 'User'}
              </div>
              <div className="text-gray-500 text-xs leading-tight">BP Employee</div>
            </div>
            <svg
              className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown panel */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-bp-surface border border-bp-border rounded-xl shadow-2xl overflow-hidden">
              {/* Profile section */}
              <div className="px-4 py-4 border-b border-bp-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-bp-blue flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium truncate">{user?.email}</div>
                    <div className="text-gray-500 text-xs">BP Employee</div>
                  </div>
                </div>
                {loginDate && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-600">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Signed in {loginDate}
                  </div>
                )}
              </div>

              {/* Menu items */}
              <div className="p-2">
                <button
                  onClick={() => { setDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:bg-bp-card hover:text-white rounded-lg text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile settings
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:bg-bp-card hover:text-white rounded-lg text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Preferences
                </button>
              </div>

              {/* Logout */}
              <div className="p-2 border-t border-bp-border">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
