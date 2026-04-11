// ─────────────────────────────────────────────────────────────────────────────
// Refiner AI — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

// ── Refinery / Site ───────────────────────────────────────────────────────────
export type SiteStatus = 'healthy' | 'warning' | 'critical';

export interface Refinery {
  id: string;
  name: string;
  location: string;
  country: string;
  lat: number;
  lng: number;
  status: SiteStatus;
  assetCount: number;
  criticalAlerts: number;
}

// ── Equipment ─────────────────────────────────────────────────────────────────
export type EquipmentStatus = 'healthy' | 'warning' | 'critical' | 'offline';
export type AIStatus = 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'HEALTHY' | 'MONITORING';
export type ActionType = 'Dispatch' | 'Schedule' | 'Monitor' | 'Inspect';

export interface Equipment {
  id: string;
  tag: string;
  name: string;
  manufacturer: string;
  model: string;
  siteId: string;
  siteName: string;
  healthScore: number;
  rul: string;         // Remaining Useful Life (e.g. "48h", "3d", "14d")
  aiStatus: AIStatus;
  action: ActionType;
  lastUpdated: string;
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export type AlertSeverity = 'critical' | 'warning' | 'advisory';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  equipmentTag: string;
  site: string;
  details: string;
  rul: string;
  confidence: number;
  detectedAt: string;
  model: string;
}

// ── Digital Twin ──────────────────────────────────────────────────────────────
export interface SensorReading {
  label: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'alarm';
  threshold?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface VibrationPoint {
  timestamp: string;
  value: number;
  alarm: number;
}

export interface DigitalTwin {
  equipmentId: string;
  tag: string;
  name: string;
  status: string;
  sensors: SensorReading[];
  vibrationHistory: VibrationPoint[];
  healthIndex: number;
  predictedRul: number; // hours
}

// ── ML Models ─────────────────────────────────────────────────────────────────
export type ModelType = 'LSTM' | 'XGBoost' | 'Random Forest' | 'GNN' | 'PINN' | 'Weibull' | 'Isolation Forest';

export interface MLModel {
  id: string;
  name: string;
  type: ModelType;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrained: string;
  assetsMonitored: number;
  status: 'active' | 'training' | 'deprecated';
}

// ── Spare Parts ───────────────────────────────────────────────────────────────
export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'on-order';

export interface SparePart {
  id: string;
  partNumber: string;
  name: string;
  category: string;
  compatibleEquipment: string[];
  stockLevel: number;
  minStockLevel: number;
  stockStatus: StockStatus;
  leadTimeDays: number;
  unitCost: number;
  location: string;
  lastOrdered?: string;
}

// ── Work Orders ───────────────────────────────────────────────────────────────
export type WorkOrderStatus = 'open' | 'in-progress' | 'completed' | 'cancelled';
export type WorkOrderPriority = 'critical' | 'high' | 'medium' | 'low';

export interface WorkOrder {
  id: string;
  title: string;
  equipmentTag: string;
  site: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assignedTo: string;
  estimatedHours: number;
  aiGenerated: boolean;
  createdAt: string;
  dueDate: string;
}

// ── Dashboard KPIs ────────────────────────────────────────────────────────────
export interface DashboardKPIs {
  unplannedEventsAvoided: number;
  targetReduction: number;
  equipmentMonitored: number;
  newlyOnboarded: number;
  criticalAlerts: number;
  criticalRequiringAction: number;
  aiModelAccuracy: number;
  accuracyChange: number;
}

// ── ROI Analytics ─────────────────────────────────────────────────────────────
export interface ROIMetrics {
  annualSavings: number;
  downtimeReduction: number;
  targetDowntimeReduction: number;
  preventedFailures: number;
  avgRepairCostAvoided: number;
  productionLossAvoided: number;
  monthlyTrend: { month: string; savings: number; target: number }[];
}
