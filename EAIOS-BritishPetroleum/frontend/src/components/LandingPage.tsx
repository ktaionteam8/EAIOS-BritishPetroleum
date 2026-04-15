import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { DomainDropdown } from './DomainDropdown';
import { ApplicationCard } from './ApplicationCard';
import { AgentCard } from './AgentCard';
import { Domain, DOMAINS, APPLICATIONS, AGENTS, AppCategory } from '../types';

type CategoryFilter = 'All' | AppCategory;
const CATEGORY_FILTERS: CategoryFilter[] = ['All', 'Transactional', 'Analytical'];

const DOMAIN_BG_COLORS: Record<string, string> = {
  '01-finance-accounting':             'from-emerald-900/20 to-transparent border-emerald-800/20',
  '02-human-resources-safety':         'from-blue-900/20 to-transparent border-blue-800/20',
  '03-it-operations-cybersecurity':    'from-purple-900/20 to-transparent border-purple-800/20',
  '04-commercial-trading':             'from-amber-900/20 to-transparent border-amber-800/20',
  '05-manufacturing-plant-operations': 'from-orange-900/20 to-transparent border-orange-800/20',
  '06-supply-chain-logistics':         'from-cyan-900/20 to-transparent border-cyan-800/20',
};

const DOMAIN_ACCENT: Record<string, string> = {
  '01-finance-accounting':             'text-emerald-400',
  '02-human-resources-safety':         'text-blue-400',
  '03-it-operations-cybersecurity':    'text-purple-400',
  '04-commercial-trading':             'text-amber-400',
  '05-manufacturing-plant-operations': 'text-orange-400',
  '06-supply-chain-logistics':         'text-cyan-400',
};

const DOMAIN_STATS: Record<string, Array<{ label: string; value: string }>> = {
  '01-finance-accounting':             [{ label: 'Agents', value: '6' }, { label: 'Workflows', value: '24' }, { label: 'Data Sources', value: 'SAP' }],
  '02-human-resources-safety':         [{ label: 'Agents', value: '6' }, { label: 'Workflows', value: '18' }, { label: 'Data Sources', value: 'Workday, SAP HR' }],
  '03-it-operations-cybersecurity':    [{ label: 'Agents', value: '6' }, { label: 'Workflows', value: '32' }, { label: 'Data Sources', value: 'SIEM, ServiceNow' }],
  '04-commercial-trading':             [{ label: 'Agents', value: '6' }, { label: 'Workflows', value: '28' }, { label: 'Data Sources', value: 'Bloomberg, ICE' }],
  '05-manufacturing-plant-operations': [{ label: 'Agents', value: '6' }, { label: 'Workflows', value: '40' }, { label: 'Data Sources', value: 'OSIsoft PI, DCS' }],
  '06-supply-chain-logistics':         [{ label: 'Agents', value: '6' }, { label: 'Workflows', value: '22' }, { label: 'Data Sources', value: 'SAP SCM, TMS' }],
};

export const LandingPage: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState<Domain>(DOMAINS[0]);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');

  // Reset filter when domain changes
  useEffect(() => { setCategoryFilter('All'); }, [selectedDomain]);

  const domainApps = APPLICATIONS.filter(
    (app) => app.domainId === selectedDomain.id
  );
  const filteredApps = categoryFilter === 'All'
    ? domainApps
    : domainApps.filter((app) => app.category === categoryFilter);

  const domainAgents = AGENTS.filter(
    (a) => a.domainId === selectedDomain.id
  );

  const accentColor = DOMAIN_ACCENT[selectedDomain.id];
  const bgGradient = DOMAIN_BG_COLORS[selectedDomain.id];
  const stats = DOMAIN_STATS[selectedDomain.id] ?? [];

  return (
    <div className="min-h-screen bg-bp-dark font-sans">
      <Header />

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">

        {/* Domain selector row */}
        <div className="mb-8">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Active Domain</p>
          <DomainDropdown selectedDomain={selectedDomain} onSelect={setSelectedDomain} />
        </div>

        {/* Domain hero banner */}
        <div className={`bg-gradient-to-r ${bgGradient} border rounded-2xl p-6 sm:p-8 mb-8`}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div className="flex-1">
              <div className={`text-xs font-semibold uppercase tracking-widest mb-2 ${accentColor}`}>
                Business Domain
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">
                {selectedDomain.name}
              </h1>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-2xl">
                {selectedDomain.description}
              </p>
            </div>

            {/* Stats */}
            <div className="flex sm:flex-col gap-4 sm:gap-3 sm:min-w-[140px]">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-bp-surface/60 rounded-xl px-4 py-3 text-center sm:text-right">
                  <div className={`text-lg font-bold ${accentColor}`}>{stat.value}</div>
                  <div className="text-gray-500 text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Applications section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Applications</h2>
              <p className="text-gray-500 text-sm">
                {domainApps.length > 0
                  ? `${filteredApps.length} of ${domainApps.length} application${domainApps.length !== 1 ? 's' : ''} deployed in this domain`
                  : 'No applications deployed in this domain yet'}
              </p>
            </div>
            <button className="text-xs text-bp-blue hover:text-white border border-bp-blue/30 hover:border-bp-blue rounded-lg px-3 py-2 transition-colors hidden sm:flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add application
            </button>
          </div>

          {/* Category filter tabs */}
          {domainApps.length > 0 && (
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              {CATEGORY_FILTERS.map((cat) => {
                const count = cat === 'All' ? domainApps.length : domainApps.filter(a => a.category === cat).length;
                const isActive = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                      isActive
                        ? 'bg-bp-blue/20 border-bp-blue text-bp-blue'
                        : 'bg-transparent border-bp-border text-gray-400 hover:border-gray-500 hover:text-gray-200'
                    }`}
                  >
                    {cat}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      isActive ? 'bg-bp-blue/30 text-bp-blue' : 'bg-bp-surface text-gray-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {filteredApps.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApps.map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
            </div>
          ) : domainApps.length > 0 ? (
            /* No results for current filter */
            <div className="border border-dashed border-bp-border rounded-2xl p-10 text-center">
              <p className="text-gray-500 text-sm">No <span className="text-gray-300">{categoryFilter}</span> applications in this domain.</p>
              <button onClick={() => setCategoryFilter('All')} className="mt-3 text-xs text-bp-blue hover:underline">Show all</button>
            </div>
          ) : (
            /* Empty state */
            <div className="border border-dashed border-bp-border rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-bp-surface border border-bp-border flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-base mb-1">No applications yet</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Applications for the <span className="text-gray-300">{selectedDomain.name}</span> domain will
                appear here once they are deployed and mapped.
              </p>
              <button className="mt-5 inline-flex items-center gap-2 bg-bp-blue hover:bg-[#0066cc] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Deploy first application
              </button>
            </div>
          )}
        </section>

        {/* Agents section */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Agents</h2>
              <p className="text-gray-500 text-sm">
                {domainAgents.length} worker agent{domainAgents.length !== 1 ? 's' : ''} deployed in this domain
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {(['active', 'idle', 'training'] as const).map(s => {
                const count = domainAgents.filter(a => a.status === s).length;
                if (!count) return null;
                const cls = s === 'active' ? 'text-emerald-400 bg-emerald-900/20 border-emerald-800/30'
                          : s === 'idle'   ? 'text-gray-400 bg-gray-800/40 border-gray-700/30'
                          :                  'text-amber-400 bg-amber-900/20 border-amber-800/30';
                return (
                  <span key={s} className={`text-xs font-semibold px-2 py-1 rounded-full border ${cls}`}>
                    {count} {s}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {domainAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} accentClass={accentColor} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
