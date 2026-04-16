import React, { useState, useEffect } from 'react';
import { fetchAuditLogs, auditLogCsvUrl, AIAuditLog } from '../api/client';

interface AuditLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
  domainId?: string;
  agentName?: string;
  title?: string;
  fallbackData?: AIAuditLog[];
}

const STATUS_STYLES: Record<string, string> = {
  auto_executed:  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  approved:       'bg-green-500/20 text-green-300 border-green-500/30',
  rejected:       'bg-red-500/20 text-red-300 border-red-500/30',
  pending_review: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

function ConfidenceBar({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-green-500' : score >= 75 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-bp-surface rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-300 w-10 text-right">{score.toFixed(1)}%</span>
    </div>
  );
}

function LogEntry({ entry }: { entry: AIAuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const statusStyle = STATUS_STYLES[entry.status] ?? 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  const date = new Date(entry.created_at).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="border border-bp-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left px-4 py-3 bg-bp-surface hover:bg-bp-card transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide ${statusStyle}`}>
                {entry.status.replace('_', ' ')}
              </span>
              <span className="text-gray-500 text-xs">{entry.agent_name}</span>
            </div>
            <p className="text-white text-sm font-medium leading-snug truncate">{entry.action}</p>
            <p className="text-gray-500 text-xs mt-0.5">{date} · {entry.triggered_by}</p>
          </div>
          <svg
            className={`w-4 h-4 text-gray-500 flex-shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="mt-2">
          <ConfidenceBar score={entry.confidence_score} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 py-4 bg-bp-dark border-t border-bp-border space-y-4">
          {/* Explainability — Why the AI decided this */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-bp-green mb-1.5">
              Why the AI made this decision
            </p>
            <p className="text-gray-300 text-sm leading-relaxed bg-bp-surface/60 rounded-lg px-3 py-2.5">
              {entry.input_context}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-bp-blue mb-1.5">
              What the AI recommended
            </p>
            <p className="text-gray-300 text-sm leading-relaxed bg-bp-surface/60 rounded-lg px-3 py-2.5">
              {entry.output_summary}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-bp-surface/60 rounded-lg px-3 py-2">
              <p className="text-gray-500 mb-0.5">Model Version</p>
              <p className="text-gray-200 font-mono">{entry.model_version}</p>
            </div>
            <div className="bg-bp-surface/60 rounded-lg px-3 py-2">
              <p className="text-gray-500 mb-0.5">Entry ID</p>
              <p className="text-gray-200 font-mono truncate">{entry.id.slice(0, 18)}…</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const AuditLogPanel: React.FC<AuditLogPanelProps> = ({
  isOpen, onClose, domainId, agentName, title = 'AI Audit Log', fallbackData,
}) => {
  const [logs, setLogs] = useState<AIAuditLog[]>(fallbackData ?? []);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchAuditLogs({ domain_id: domainId, agent_name: agentName, limit: 50 })
      .then(data => setLogs(data.length > 0 ? data : (fallbackData ?? [])))
      .catch(() => setLogs(fallbackData ?? []))
      .finally(() => setLoading(false));
  }, [isOpen, domainId, agentName]);

  const filtered = statusFilter ? logs.filter(l => l.status === statusFilter) : logs;
  const csvUrl = auditLogCsvUrl({ domain_id: domainId, agent_name: agentName });

  const handlePrint = () => window.print();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Slide-in panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-bp-navy border-l border-bp-border z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bp-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-bp-green/10 border border-bp-green/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-bp-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">{title}</h2>
              <p className="text-gray-500 text-xs">Black-box recorder — {filtered.length} entries</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-bp-border flex-shrink-0 flex-wrap">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-bp-surface border border-bp-border text-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="">All statuses</option>
            <option value="auto_executed">Auto Executed</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="pending_review">Pending Review</option>
          </select>
          <div className="flex-1" />
          <a href={csvUrl} download className="flex items-center gap-1.5 text-xs bg-bp-surface hover:bg-bp-card border border-bp-border text-gray-300 hover:text-white rounded-lg px-3 py-1.5 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </a>
          <button onClick={handlePrint} className="flex items-center gap-1.5 text-xs bg-bp-surface hover:bg-bp-card border border-bp-border text-gray-300 hover:text-white rounded-lg px-3 py-1.5 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / PDF
          </button>
        </div>

        {/* Log entries */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-bp-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">No audit entries found.</div>
          ) : (
            filtered.map(entry => <LogEntry key={entry.id} entry={entry} />)
          )}
        </div>
      </div>
    </>
  );
};
