import React, { useState } from 'react';

interface Notification {
  id: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Compressor C-201 — Failure Risk',
    body: 'Vibration anomaly detected at Whiting Refinery. 94% failure probability within 72 hrs.',
    time: '2m ago',
    read: false,
  },
  {
    id: '2',
    type: 'warning',
    title: 'SOX Compliance Review Due',
    body: 'FCA Framework audit window closes in 3 days. 2 unresolved compliance events pending.',
    time: '15m ago',
    read: false,
  },
  {
    id: '3',
    type: 'info',
    title: 'ARTEMIS Arbitrage Signal',
    body: 'Brent-WTI spread opportunity identified. Confidence: 87%. Est. value: $2.4M.',
    time: '1h ago',
    read: false,
  },
  {
    id: '4',
    type: 'success',
    title: 'DB Migration Completed',
    body: 'Alembic migration 0011_artemis applied successfully across all 13 tables.',
    time: '2h ago',
    read: true,
  },
  {
    id: '5',
    type: 'alert',
    title: 'Offshore Platform P-36 Anomaly',
    body: 'Pressure sensor deviation on subsea wellhead cluster. HSE team notified.',
    time: '3h ago',
    read: true,
  },
  {
    id: '6',
    type: 'success',
    title: 'RefAIne Model Retrained',
    body: 'Predictive maintenance model accuracy improved from 94.1% → 97.3% after retraining.',
    time: '5h ago',
    read: true,
  },
];

const TYPE_CONFIG = {
  alert:   { bg: 'bg-red-500/15',   icon: 'text-red-400',   dot: 'bg-red-400' },
  warning: { bg: 'bg-amber-500/15', icon: 'text-amber-400', dot: 'bg-amber-400' },
  info:    { bg: 'bg-bp-blue/15',   icon: 'text-bp-blue',   dot: 'bg-bp-blue' },
  success: { bg: 'bg-bp-green/15',  icon: 'text-bp-green',  dot: 'bg-bp-green' },
};

function TypeIcon({ type }: { type: Notification['type'] }) {
  const cls = `w-4 h-4 ${TYPE_CONFIG[type].icon}`;
  if (type === 'alert') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
  if (type === 'warning') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  if (type === 'success') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  return (
    <div
      className={`absolute right-0 mt-2 w-80 sm:w-96 bg-bp-surface border border-bp-border rounded-xl shadow-2xl overflow-hidden
        transition-all duration-200 ease-out origin-top-right
        ${isOpen
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
      style={{ zIndex: 60 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bp-border">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-bp-blue hover:text-white transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-bp-border/50">
        {notifications.map((n) => {
          const cfg = TYPE_CONFIG[n.type];
          return (
            <button
              key={n.id}
              onClick={() => { markRead(n.id); onClose(); }}
              className={`w-full text-left px-4 py-3 hover:bg-bp-card/60 transition-colors flex gap-3 items-start ${
                !n.read ? 'bg-bp-card/30' : ''
              }`}
            >
              {/* Icon */}
              <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <TypeIcon type={n.type} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs font-semibold leading-tight ${!n.read ? 'text-white' : 'text-gray-300'}`}>
                    {n.title}
                  </p>
                  <span className="text-xs text-gray-600 flex-shrink-0">{n.time}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                  {n.body}
                </p>
              </div>

              {/* Unread dot */}
              {!n.read && (
                <span className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0 mt-1.5`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-bp-border text-center">
        <button
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
};

export function useUnreadCount(): number {
  return INITIAL_NOTIFICATIONS.filter((n) => !n.read).length;
}
