// ─────────────────────────────────────────────────────────────────────────────
// Refiner AI — App-level Context
// Holds active tab, selected equipment, and global UI state.
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState } from 'react';

export type TabId =
  | 'dashboard'
  | 'live-alerts'
  | 'equipment-health'
  | 'digital-twin'
  | 'ai-advisor'
  | 'ml-models'
  | 'spare-parts'
  | 'work-orders'
  | 'roi';

interface RefinerAIContextValue {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  selectedEquipmentId: string | null;
  setSelectedEquipmentId: (id: string | null) => void;
}

const RefinerAIContext = createContext<RefinerAIContextValue | null>(null);

export const RefinerAIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab]                     = useState<TabId>('dashboard');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);

  return (
    <RefinerAIContext.Provider value={{ activeTab, setActiveTab, selectedEquipmentId, setSelectedEquipmentId }}>
      {children}
    </RefinerAIContext.Provider>
  );
};

export function useRefinerAIContext(): RefinerAIContextValue {
  const ctx = useContext(RefinerAIContext);
  if (!ctx) throw new Error('useRefinerAIContext must be used within RefinerAIProvider');
  return ctx;
}
