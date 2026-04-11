import React, { useState, useRef, useEffect } from 'react';
import { Domain, DOMAINS } from '../types';

interface DomainDropdownProps {
  selectedDomain: Domain;
  onSelect: (domain: Domain) => void;
}

const DOMAIN_COLORS: Record<string, string> = {
  '01-finance-accounting':          'text-emerald-400',
  '02-human-resources-safety':      'text-blue-400',
  '03-it-operations-cybersecurity': 'text-purple-400',
  '04-commercial-trading':          'text-amber-400',
  '05-manufacturing-plant-operations': 'text-orange-400',
  '06-supply-chain-logistics':      'text-cyan-400',
};

function DomainIcon({ id, className }: { id: string; className?: string }) {
  const cls = `w-4 h-4 ${className ?? ''}`;
  switch (id) {
    case '01-finance-accounting':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    case '02-human-resources-safety':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case '03-it-operations-cybersecurity':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case '04-commercial-trading':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    case '05-manufacturing-plant-operations':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
  }
}

export const DomainDropdown: React.FC<DomainDropdownProps> = ({ selectedDomain, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (domain: Domain) => {
    onSelect(domain);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 bg-bp-card hover:bg-[#243040] border border-bp-border rounded-xl px-4 py-2.5 transition-colors min-w-[220px] sm:min-w-[280px]"
      >
        <DomainIcon id={selectedDomain.id} className={DOMAIN_COLORS[selectedDomain.id]} />
        <div className="text-left flex-1 min-w-0">
          <div className="text-xs text-gray-500 leading-tight">Business Domain</div>
          <div className="text-white text-sm font-medium leading-tight truncate">
            {selectedDomain.name}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-full sm:w-80 bg-bp-surface border border-bp-border rounded-xl shadow-2xl overflow-hidden z-40">
          <div className="p-2 border-b border-bp-border">
            <p className="text-xs text-gray-500 px-2 py-1">Select a business domain</p>
          </div>
          <div className="p-2 max-h-80 overflow-y-auto">
            {DOMAINS.map((domain) => {
              const isActive = domain.id === selectedDomain.id;
              return (
                <button
                  key={domain.id}
                  onClick={() => handleSelect(domain)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-bp-blue/20 border border-bp-blue/30'
                      : 'hover:bg-bp-card border border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-bp-blue/30' : 'bg-bp-card'
                  }`}>
                    <DomainIcon id={domain.id} className={DOMAIN_COLORS[domain.id]} />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-200'}`}>
                      {domain.name}
                    </div>
                    <div className="text-xs text-gray-500">{domain.agentCount} agents</div>
                  </div>
                  {isActive && (
                    <svg className="w-4 h-4 text-bp-blue ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
