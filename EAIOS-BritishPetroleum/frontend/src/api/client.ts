/**
 * Centralised API client for EAIOS-BP backend (http://localhost:8000).
 * All domain-specific fetchers live here so components stay thin.
 */

const BASE = "http://localhost:8000";

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const fetchDashboard = () => get<DashboardOut>("/api/dashboard");

// ── Alerts ────────────────────────────────────────────────────────────────────
export const fetchAlerts = (params?: { status?: string; severity?: string; site_id?: string }) =>
  get<Alert[]>("/api/alerts", params as Record<string, string>);

export const fetchAlert = (id: string) => get<AlertDetail>(`/api/alerts/${id}`);

export const postDecision = (alertId: string, body: DecisionCreate) =>
  post<Decision>(`/api/alerts/${alertId}/decision`, body);

export const fetchAuditLog = () => get<AuditLog[]>("/api/alerts/audit/log");

// ── Equipment ─────────────────────────────────────────────────────────────────
export const fetchEquipment = (params?: { site_id?: string; ai_status?: string }) =>
  get<Equipment[]>("/api/equipment", params as Record<string, string>);

export const fetchEquipmentReadings = (equipmentId: string, limit = 100) =>
  get<SensorReading[]>(`/api/equipment/${equipmentId}/readings`, { limit: String(limit) });

export const postSensorReading = (equipmentId: string, body: SensorReadingCreate) =>
  post<SensorReading>(`/api/equipment/${equipmentId}/readings`, body);

// ── ML Models ─────────────────────────────────────────────────────────────────
export const fetchMLModels = (status?: string) =>
  get<MLModel[]>("/api/ml-models", status ? { status } : undefined);

export const fetchMLModel = (id: string) => get<MLModelDetail>(`/api/ml-models/${id}`);

export const postModelFeedback = (modelId: string, body: ModelFeedbackCreate) =>
  post<ModelFeedback>(`/api/ml-models/${modelId}/feedback`, body);

export const approveModel = (modelId: string) =>
  patch<MLModel>(`/api/ml-models/${modelId}/approve`, {});

// ── Work Orders ───────────────────────────────────────────────────────────────
export const fetchWorkOrders = (params?: { status?: string; site_id?: string }) =>
  get<WorkOrder[]>("/api/work-orders", params as Record<string, string>);

export const createWorkOrder = (body: WorkOrderCreate) =>
  post<WorkOrder>("/api/work-orders", body);

export const updateWorkOrderStatus = (id: string, body: { status: string; cost_actual?: number }) =>
  patch<WorkOrder>(`/api/work-orders/${id}`, body);

// ── Spare Parts ───────────────────────────────────────────────────────────────
export const fetchSpareParts = () => get<SparePart[]>("/api/spare-parts");
export const fetchStock = (site_id?: string) =>
  get<SparePartStock[]>("/api/spare-parts/stock", site_id ? { site_id } : undefined);
export const fetchProcurement = () => get<ProcurementOrder[]>("/api/procurement-orders");
export const createProcurement = (body: ProcurementOrderCreate) =>
  post<ProcurementOrder>("/api/procurement-orders", body);

// ── ROI / KPI ─────────────────────────────────────────────────────────────────
export const fetchKPIs = (scope?: string) =>
  get<KpiSnapshot[]>("/api/roi/kpis", scope ? { scope } : undefined);

// ── Energy ────────────────────────────────────────────────────────────────────
export const fetchEnergyTargets = () => get<EnergyTarget[]>("/api/energy/targets");
export const fetchEnergySavings = () => get<EnergySavingEvent[]>("/api/energy/savings");

// ── Compliance ────────────────────────────────────────────────────────────────
export const fetchComplianceAudits = () => get<ComplianceAudit[]>("/api/compliance/audits");
export const fetchComplianceActions = () => get<ComplianceAction[]>("/api/compliance/actions");

// ── TAR ───────────────────────────────────────────────────────────────────────
export const fetchTarEvents = (site_id?: string) =>
  get<TarEvent[]>("/api/tar", site_id ? { site_id } : undefined);

// ── Offshore ──────────────────────────────────────────────────────────────────
export const fetchPlatforms = () => get<Platform[]>("/api/offshore/platforms");
export const fetchWellIntegrity = () => get<WellIntegrity[]>("/api/offshore/well-integrity");
export const fetchSubseaAlerts = () => get<SubseaAlert[]>("/api/offshore/subsea-alerts");

// ── Adoption ──────────────────────────────────────────────────────────────────
export const fetchAdoptionMetrics = () => get<AdoptionMetric[]>("/api/adoption/metrics");
export const fetchTrainingModules = () => get<TrainingModule[]>("/api/adoption/training");

// ── Wave Tracker ──────────────────────────────────────────────────────────────
export const fetchWaves = () => get<Wave[]>("/api/waves");

// ── Edge AI ───────────────────────────────────────────────────────────────────
export const fetchEdgeNodes = () => get<EdgeNode[]>("/api/edge/nodes");
export const fetchLatencyBenchmarks = () => get<LatencyBenchmark[]>("/api/edge/benchmarks");

// ─── Type stubs (minimal — keep in sync with backend schemas) ────────────────
export interface DashboardOut {
  stats: { total_equipment: number; critical_count: number; warning_count: number; healthy_count: number; active_alerts: number; open_work_orders: number; avoided_cost_usd: number; fleet_oee_pct: number };
  sites: { id: string; name: string; code: string; country: string; status: string }[];
  top_risks: { id: string; tag: string; name: string; site_name: string; health_score: number; rul_hours: number | null; ai_status: string }[];
}
export interface Alert { id: string; alert_code: string; severity: string; title: string; equipment_id: string; site_id: string; failure_mode: string; probability: number; etf_days: number; etf_min: number; etf_max: number; recommendation: string; status: string; created_at: string; }
export interface AlertDetail extends Alert { details?: string; shap_signals: ShapSignal[]; analogues: Analogue[]; }
export interface ShapSignal { id: string; signal_name: string; values: number[]; contribution: number; unit: string; sort_order: number; }
export interface Analogue { id: string; site_name: string; event_date: string; outcome: string; days_to_failure: number; match_score: number; }
export interface DecisionCreate { user_id: string; decision: string; reason_code?: string; modified_action?: string; modified_timing?: string; }
export interface Decision { id: string; alert_id: string; decision: string; decided_at: string; }
export interface AuditLog { id: string; alert_title: string; decision: string; user_name: string; timestamp: string; }
export interface Equipment { id: string; tag: string; name: string; equipment_type: string; site_id: string; health_score: number; rul_hours: number | null; ai_status: string; }
export interface SensorReading { id: string; equipment_id: string; tag_name: string; sensor_type: string; value: number; unit: string; timestamp: string; }
export interface SensorReadingCreate { tag_name: string; sensor_type: string; value: number; unit: string; }
export interface MLModel { id: string; model_code: string; name: string; model_type: string; version: string; status: string; accuracy: number; drift_status: string; approval_status: string; is_champion: boolean; }
export interface MLModelDetail extends MLModel { shap_features: { feature_name: string; importance_score: number; direction: string }[]; }
export interface ModelFeedbackCreate { feedback_type: string; alert_id?: string; notes?: string; }
export interface ModelFeedback { id: string; model_id: string; feedback_type: string; }
export interface WorkOrder { id: string; wo_number: string; title: string; equipment_id: string; site_id: string; priority: string; status: string; ai_generated: boolean; cost_estimate: number | null; scheduled_start: string | null; due_date: string | null; }
export interface WorkOrderCreate { title: string; equipment_id: string; site_id: string; priority?: string; description?: string; ai_generated?: boolean; }
export interface SparePart { id: string; part_number: string; description: string; unit_cost: number; lead_time_days: number; criticality_score: number; }
export interface SparePartStock { id: string; part_id: string; site_id: string; on_hand_qty: number; min_qty: number; on_order_qty: number; }
export interface ProcurementOrder { id: string; po_number: string; part_id: string; quantity: number; total_cost: number; status: string; ordered_date: string; expected_delivery: string | null; }
export interface ProcurementOrderCreate { part_id: string; site_id: string; quantity: number; urgency_days?: number; }
export interface KpiSnapshot { id: string; scope: string; site_id: string | null; snapshot_date: string; mtbf_hours: number | null; mttr_hours: number | null; oee_pct: number | null; }
export interface EnergyTarget { id: string; site_id: string; fiscal_year: number; target_gj_per_t: number; }
export interface EnergySavingEvent { id: string; site_id: string; event_date: string; cost_avoided_usd: number; source: string; }
export interface ComplianceAudit { id: string; site_id: string; audit_date: string; score_pct: number; status: string; }
export interface ComplianceAction { id: string; action_description: string; due_date: string | null; status: string; owner: string | null; }
export interface TarEvent { id: string; tar_code: string; site_id: string; unit_name: string; start_date: string; end_date: string; status: string; budget_usd: number; duration_days?: number; work_scope_count?: number; pct_complete?: number; }
export interface Platform { id: string; name: string; field_name: string; status: string; production_bopd: number; uptime_pct: number; }
export interface WellIntegrity { id: string; well_name: string; barrier_type: string; status: string; }
export interface SubseaAlert { id: string; platform_id: string; asset_name: string; asset_type: string; issue_description: string; failure_probability_pct: number; eta_days: number; }
export interface AdoptionMetric { id: string; site_id: string; adoption_score: number; active_users: number; total_users: number; avg_alert_action_rate_pct: number; }
export interface TrainingModule { id: string; code: string; name: string; module_type: string; estimated_duration_hours: number; }
export interface Wave { id: string; wave_number: number; wave_name: string; status: string; pct_complete: number; budget_usd: number; }
export interface EdgeNode { id: string; node_code: string; site_id: string; status: string; avg_latency_ms: number; inference_offload_pct: number; }
export interface LatencyBenchmark { id: string; scenario_description: string; edge_latency_ms: number; cloud_latency_ms: number; latency_saving_pct: number; }
