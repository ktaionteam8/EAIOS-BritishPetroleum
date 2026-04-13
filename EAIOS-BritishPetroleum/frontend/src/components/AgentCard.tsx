import React from 'react';
import { Agent } from '../types';

interface AgentCardProps {
  agent: Agent;
  accentClass: string;
}

const STATUS: Record<Agent['status'], { bg: string; text: string; dot: string; label: string }> = {
  active:   { bg: 'bg-emerald-900/30', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Active'   },
  idle:     { bg: 'bg-gray-800/60',    text: 'text-gray-400',    dot: 'bg-gray-500',    label: 'Idle'     },
  training: { bg: 'bg-amber-900/30',   text: 'text-amber-400',   dot: 'bg-amber-400',   label: 'Training' },
  error:    { bg: 'bg-red-900/30',     text: 'text-red-400',     dot: 'bg-red-400',     label: 'Error'    },
};

const fmt = (n: number): string =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(1)}k`
  : String(n);

export const AgentCard: React.FC<AgentCardProps> = ({ agent, accentClass }) => {
  const s = STATUS[agent.status];
  return (
    <div className="bg-bp-surface border border-bp-border rounded-xl p-4 flex flex-col gap-3 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${accentClass}`}>Worker Agent</p>
          <p className="text-white font-semibold text-sm leading-snug">{agent.name}</p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${s.bg} ${s.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{agent.description}</p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-bp-border">
        <div className="text-center">
          <p className={`text-sm font-bold font-mono ${accentClass}`}>{fmt(agent.tasksProcessed)}</p>
          <p className="text-gray-600 text-xs">Tasks</p>
        </div>
        <div className="text-center">
          <p className={`text-sm font-bold font-mono ${accentClass}`}>{agent.accuracy}%</p>
          <p className="text-gray-600 text-xs">Accuracy</p>
        </div>
        <div className="text-center">
          <p className={`text-sm font-bold font-mono ${accentClass}`}>{agent.uptime}%</p>
          <p className="text-gray-600 text-xs">Uptime</p>
        </div>
      </div>

      {/* Last run */}
      <p className="text-gray-600 text-xs">Last run: {agent.lastRun}</p>
    </div>
  );
};
