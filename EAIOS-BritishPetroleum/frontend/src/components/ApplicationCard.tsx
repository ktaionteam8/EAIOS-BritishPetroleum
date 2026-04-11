import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Application } from '../types';

interface ApplicationCardProps {
  application: Application;
}

const STATUS_CONFIG = {
  active:      { label: 'Active',       dot: 'bg-bp-green',   text: 'text-bp-green',   bg: 'bg-bp-green/10 border-bp-green/30' },
  inactive:    { label: 'Inactive',     dot: 'bg-gray-500',   text: 'text-gray-400',   bg: 'bg-gray-700/20 border-gray-700/30' },
  maintenance: { label: 'Maintenance',  dot: 'bg-amber-500',  text: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30' },
} as const;

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application }) => {
  const navigate = useNavigate();
  const status = STATUS_CONFIG[application.status];

  const handleOpen = () => {
    if (application.url) {
      navigate(application.url);
    }
  };

  return (
    <div className="bg-bp-card border border-bp-border rounded-xl p-5 hover:border-bp-blue/40 hover:shadow-lg hover:shadow-bp-blue/5 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* App icon placeholder */}
        <div className="w-10 h-10 rounded-xl bg-bp-blue/20 border border-bp-blue/30 flex items-center justify-center flex-shrink-0 group-hover:bg-bp-blue/30 transition-colors">
          <svg className="w-5 h-5 text-bp-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${status.bg} ${status.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${application.status === 'active' ? 'animate-pulse' : ''}`} />
          {status.label}
        </span>
      </div>

      <h3 className="text-white font-semibold text-base mb-1 group-hover:text-bp-blue transition-colors">
        {application.name}
      </h3>

      {application.description ? (
        <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
          {application.description}
        </p>
      ) : (
        <p className="text-gray-600 text-sm italic">No description available.</p>
      )}

      <div className="mt-4 pt-4 border-t border-bp-border flex items-center justify-between">
        {application.version && (
          <span className="text-xs text-gray-600">v{application.version}</span>
        )}
        <button
          onClick={handleOpen}
          disabled={!application.url}
          className="ml-auto flex items-center gap-1.5 text-xs text-bp-blue hover:text-white transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Open application
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
};
