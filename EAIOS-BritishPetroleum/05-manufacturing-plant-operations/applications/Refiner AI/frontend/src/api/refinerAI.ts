// ─────────────────────────────────────────────────────────────────────────────
// Refiner AI — API Client
// All calls route through the FastAPI backend at REACT_APP_API_URL
// ─────────────────────────────────────────────────────────────────────────────

import {
  DashboardKPIs,
  Refinery,
  Alert,
  Equipment,
  DigitalTwin,
  MLModel,
  SparePart,
  WorkOrder,
  ROIMetrics,
} from '../types';

const BASE_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:8001';
const API = `${BASE_URL}/api/refiner-ai`;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export const refinerAIApi = {
  // Dashboard
  getDashboardKPIs:   (): Promise<DashboardKPIs> => get('/dashboard/kpis'),
  getRefineries:      (): Promise<Refinery[]>     => get('/refineries'),

  // Alerts
  getAlerts:          (): Promise<Alert[]>         => get('/alerts'),

  // Equipment
  getEquipment:       (): Promise<Equipment[]>     => get('/equipment'),
  getEquipmentById:   (id: string): Promise<Equipment> => get(`/equipment/${id}`),

  // Digital Twin
  getDigitalTwin:     (equipmentId: string): Promise<DigitalTwin> => get(`/digital-twin/${equipmentId}`),

  // ML Models
  getMLModels:        (): Promise<MLModel[]>       => get('/ml-models'),

  // Spare Parts
  getSpareParts:      (): Promise<SparePart[]>     => get('/spare-parts'),

  // Work Orders
  getWorkOrders:      (): Promise<WorkOrder[]>     => get('/work-orders'),

  // ROI
  getROIMetrics:      (): Promise<ROIMetrics>      => get('/roi'),
};
