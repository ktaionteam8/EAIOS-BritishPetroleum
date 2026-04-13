/**
 * Centralised API client for EAIOS-BP backend.
 * All domain-specific fetchers live here so components stay thin.
 */
import { getAuthToken } from '../context/AuthContext';

if (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_API_URL) {
  console.error(
    '[EAIOS] REACT_APP_API_URL is not set. ' +
    'Set it to your Render backend URL in Vercel project settings.'
  );
}

const BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:8000';

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getAuthToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
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
export interface AdoptionMetric { id: string; site_id: string; metric_date: string; adoption_score: number; active_users: number; total_users: number; avg_alert_action_rate_pct: number; avg_response_time_min: number; training_completion_rate_pct: number; }
export interface TrainingModule { id: string; code: string; name: string; module_type: string; estimated_duration_hours: number; target_completion_pct: number; is_active: boolean; }
export interface Wave { id: string; wave_number: number; wave_name: string; period_start: string; period_end: string; status: string; pct_complete: number; budget_usd: number; actual_spent_usd: number; }
export interface EdgeNode { id: string; node_code: string; site_id: string; hardware_spec: string; status: string; avg_latency_ms: number; inference_offload_pct: number; last_sync_label: string | null; }
export interface LatencyBenchmark { id: string; scenario_description: string; edge_latency_ms: number; cloud_latency_ms: number; latency_saving_pct: number; }

// ── Dashboard extras ──────────────────────────────────────────────────────────
export const fetchDashboardSites = () => get<SiteSummary[]>("/api/dashboard/sites");
export const fetchFleetHeatmap = () => get<SiteHeatmapEntry[]>("/api/dashboard/fleet-heatmap");
export const fetchEnterpriseScore = () => get<EnterpriseScore>("/api/dashboard/enterprise-score");

// ── Equipment extras ──────────────────────────────────────────────────────────
export const fetchHealthTrend = (id: string, days = 30) =>
  get<HealthPoint[]>(`/api/equipment/${id}/health-trend`, { days: String(days) });
export const fetchFFT = (id: string) => get<FFTPoint[]>(`/api/equipment/${id}/fft`);
export const fetchRUL = (id: string) => get<RULOut>(`/api/equipment/${id}/rul`);
export const fetchFailureSignatures = () => get<FailureSignature[]>("/api/equipment/failure-signatures");
export const fetchEquipmentKPIs = (site_id?: string) =>
  get<EquipmentKPI[]>("/api/equipment/kpis", site_id ? { site_id } : undefined);

// ── ML Model extras ───────────────────────────────────────────────────────────
export const fetchModelDrift = (id: string) => get<DriftMetric[]>(`/api/ml-models/${id}/drift`);
export const fetchModelShap = (id: string) => get<ShapImportance[]>(`/api/ml-models/${id}/shap`);
export const fetchModelFeedback = (id: string) => get<ModelFeedback[]>(`/api/ml-models/${id}/feedback`);
export const retireModel = (id: string) => patch<MLModel>(`/api/ml-models/${id}/retire`, {});

// ── OT Data ───────────────────────────────────────────────────────────────────
export const fetchOTSources = (site_id?: string) =>
  get<OTSource[]>("/api/ot-data/sources", site_id ? { site_id } : undefined);
export const fetchOTQualityIssues = (params?: { source_id?: string; severity?: string }) =>
  get<OTQualityIssue[]>("/api/ot-data/quality-issues", params as Record<string, string>);

// ── Adoption extras ───────────────────────────────────────────────────────────
export const fetchAdoptionBarriers = () => get<AdoptionBarrier[]>("/api/adoption/barriers");
export const fetchAdoptionChampions = (site_id?: string) =>
  get<ChangeChampion[]>("/api/adoption/champions", site_id ? { site_id } : undefined);

// ── Wave extras ───────────────────────────────────────────────────────────────
export const fetchWaveMilestones = (waveId: string) =>
  get<WaveMilestone[]>(`/api/waves/${waveId}/milestones`);
export const fetchWaveRisks = (waveId: string) =>
  get<DeliveryRisk[]>(`/api/waves/${waveId}/risks`);
export const createWaveRisk = (waveId: string, body: DeliveryRiskCreate) =>
  post<DeliveryRisk>(`/api/waves/${waveId}/risks`, body);

// ── Edge extras ───────────────────────────────────────────────────────────────
export const fetchEdgeLatency = () => get<LatencyBenchmark[]>("/api/edge/latency");

// ── Castrol ───────────────────────────────────────────────────────────────────
export const fetchCastrolSpecs = () => get<BlendSpec[]>("/api/castrol/specs");
export const fetchCastrolRuns = (params?: { site_id?: string; status?: string }) =>
  get<BlendRun[]>("/api/castrol/runs", params as Record<string, string>);
export const fetchCastrolRunQuality = (runId: string) =>
  get<BlendQuality[]>(`/api/castrol/runs/${runId}/quality`);

// ── Digital Twin ──────────────────────────────────────────────────────────────
export const fetchDigitalTwinRegistry = (status?: string) =>
  get<TwinAsset[]>("/api/digital-twin/registry", status ? { status } : undefined);
export const fetchDigitalTwinEnvelope = (twinId: string) =>
  get<EnvelopeParam[]>(`/api/digital-twin/${twinId}/envelope`);
export const fetchScenarios = (twin_id?: string) =>
  get<TwinScenario[]>("/api/digital-twin/scenarios", twin_id ? { twin_id } : undefined);
export const runScenario = (scenarioId: string) =>
  post<ScenarioRunResult>(`/api/digital-twin/scenarios/${scenarioId}/run`, {});

// ── Reliability ───────────────────────────────────────────────────────────────
export const fetchFMEA = (params?: { equipment_type?: string; min_rpn?: string }) =>
  get<FMEAEntry[]>("/api/reliability/fmea", params as Record<string, string>);
export const fetchReliabilityKPIs = (site_id?: string) =>
  get<ReliabilityKPI[]>("/api/reliability/kpis", site_id ? { site_id } : undefined);
export const fetchRiskMatrix = (site_id?: string) =>
  get<RiskMatrixEntry[]>("/api/reliability/risk-matrix", site_id ? { site_id } : undefined);

// ── Field Ops ─────────────────────────────────────────────────────────────────
export const fetchInspectionRoutes = (params?: { site_id?: string; status?: string }) =>
  get<InspectionRoute[]>("/api/field-ops/routes", params as Record<string, string>);
export const fetchChecklist = (routeId: string) =>
  get<ChecklistItem[]>(`/api/field-ops/routes/${routeId}/checklist`);
export const completeChecklistItem = (routeId: string, itemId: string, body: { pass_fail: string; observation_notes?: string }) =>
  post<ChecklistItem>(`/api/field-ops/routes/${routeId}/items/${itemId}/complete`, body);
export const fetchContractors = (site_id?: string) =>
  get<Contractor[]>("/api/field-ops/contractors", site_id ? { site_id } : undefined);

// ── New type stubs ────────────────────────────────────────────────────────────
export interface SiteSummary { id: string; name: string; code: string; country: string; status: string; }
export interface SiteHeatmapEntry { site_id: string; site_name: string; critical: number; warning: number; healthy: number; avg_health: number; }
export interface EnterpriseScore { avg_health_score: number; total_equipment: number; critical_pct: number; oee_pct: number; avoided_cost_usd: number; }
export interface HealthPoint { timestamp: string; health_score: number; rul_hours: number | null; }
export interface FFTPoint { frequency_hz: number; amplitude: number; band: string; }
export interface RULOut { equipment_id: string; tag: string; rul_hours: number | null; rul_days: number | null; confidence_pct: number; predicted_failure_date: string | null; }
export interface FailureSignature { equipment_type: string; failure_mode: string; sensor_pattern: string; lead_time_hours: number; confidence_pct: number; }
export interface EquipmentKPI { site_id: string; total: number; critical: number; warning: number; healthy: number; avg_health_score: number; avg_rul_hours: number | null; }
export interface DriftMetric { id: string; model_id: string; metric_name: string; value: number; threshold: number; drift_detected: boolean; recorded_at: string; }
export interface ShapImportance { id: string; model_id: string; feature_name: string; importance_score: number; rank: number; }
export interface OTSource { id: string; source_code: string; source_type: string; site_id: string; tag_count: number; latency_ms: number; status: string; quality_score_pct: number; last_poll_at: string | null; }
export interface OTQualityIssue { id: string; source_id: string; tag_name: string; issue_type: string; description: string; severity: string; resolution_status: string; detected_at: string; resolved_at: string | null; }
export interface AdoptionBarrier { id: string; theme: string; description: string | null; priority: string; vote_count: number; status: string; }
export interface ChangeChampion { id: string; user_id: string; site_id: string; role: string; sessions_count: number; alerts_actioned_count: number; training_completion_pct: number; }
export interface WaveMilestone { id: string; milestone_code: string; wave_id: string; description: string; due_date: string; status: string; owner: string | null; }
export interface DeliveryRisk { id: string; risk_code: string; wave_id: string; description: string; probability: string; status: string; }
export interface DeliveryRiskCreate { risk_code: string; description: string; probability?: string; status?: string; }
export interface BlendSpec { id: string; grade_name: string; viscosity_target: number; viscosity_tol_low: number; viscosity_tol_high: number; pour_point_target: number; tbn_target: number; }
export interface BlendRun { id: string; batch_code: string; grade_name: string; site_id: string; target_volume_liters: number; progress_pct: number; status: string; started_at: string; }
export interface BlendQuality { id: string; blend_id: string; predicted_at: string; viscosity_predicted: number; pour_point_predicted: number; tbn_predicted: number; confidence_low: number | null; confidence_high: number | null; prediction_status: string; }
export interface TwinAsset { id: string; equipment_id: string; twin_type: string; fidelity: string; last_sync: string; status: string; sync_latency_ms: number | null; }
export interface EnvelopeParam { id: string; twin_id: string; parameter_name: string; current_value: number; normal_range_low: number; normal_range_high: number; unit: string; status: string; }
export interface TwinScenario { id: string; twin_id: string; name: string; description: string | null; rul_delta_hours: number | null; impact: string; created_at: string; }
export interface ScenarioRunResult { scenario_id: string; status: string; rul_delta_hours: number; impact: string; message: string; }
export interface FMEAEntry { id: string; equipment_type: string; failure_mode: string; cause: string; effect: string; severity: number; occurrence: number; detection: number; rpn: number; current_controls: string; recommended_action: string; }
export interface ReliabilityKPI { site_id: string; mtbf_hours: number; mttr_hours: number; availability_pct: number; failure_rate_per_year: number; }
export interface RiskMatrixEntry { equipment_id: string; tag: string; name: string; site_id: string; severity: number; probability: number; risk_score: number; risk_level: string; }
export interface InspectionRoute { id: string; route_code: string; name: string; priority: string; site_id: string; distance_km: number | null; estimated_duration_min: number | null; inspector_name: string | null; status: string; scheduled_date: string | null; completed_at: string | null; }
export interface ChecklistItem { id: string; route_id: string; asset_tag: string; check_description: string; iso_standard: string | null; sort_order: number; is_completed: boolean; completed_at: string | null; pass_fail: string | null; observation_notes: string | null; }
export interface Contractor { id: string; company_name: string; specialty: string; site_id: string | null; }

// ── ARTEMIS ───────────────────────────────────────────────────────────────────
export const fetchArtemisAgents = () =>
  get<ArtemisAgentStatus[]>("/api/artemis/agents");

export const fetchArtemisModels = () =>
  get<ArtemisModelRegistry[]>("/api/artemis/models");

export const fetchArtemisAuditLog = (limit = 50) =>
  get<ArtemisAuditLog[]>("/api/artemis/audit-log", { limit: String(limit) });

export const fetchArtemisCompliance = () =>
  get<ArtemisComplianceEvent[]>("/api/artemis/compliance");

export const fetchArbitrageOpportunities = (status = "open") =>
  get<ArbitrageOpportunity[]>("/api/artemis/arbitrage/opportunities", { status });

export const fetchArbitrageMetrics = (days = 30) =>
  get<ArbitrageMetric[]>("/api/artemis/arbitrage/metrics", { days: String(days) });

export const fetchBaseOilPrices = () =>
  get<BaseOilPrice[]>("/api/artemis/castrol/base-oil");

export const fetchCastrolPricingRecs = (geography?: string) =>
  get<CastrolPricingRec[]>("/api/artemis/castrol/pricing", geography ? { geography } : undefined);

export const fetchAviationForecasts = (limit = 10) =>
  get<AviationForecast[]>("/api/artemis/aviation/forecasts", { limit: String(limit) });

export const fetchAviationContracts = (status?: string) =>
  get<AviationContract[]>("/api/artemis/aviation/contracts", status ? { status } : undefined);

export const fetchCarbonPositions = () =>
  get<CarbonPosition[]>("/api/artemis/carbon/positions");

export const fetchCarbonRecommendations = () =>
  get<CarbonRecommendation[]>("/api/artemis/carbon/recommendations");

// ARTEMIS type stubs
export interface ArtemisAgentStatus {
  id: string; agent_key: string; agent_name: string; scope: string;
  status: string; signals_today: number; last_signal_at: string | null;
  primary_metric_value: string | null; primary_metric_label: string | null;
  updated_at: string;
}
export interface ArtemisModelRegistry {
  id: string; model_name: string; version: string; status: string;
  accuracy_pct: number; drift_status: string; next_review_days: number;
  agent_key: string; last_validated_at: string;
}
export interface ArtemisAuditLog {
  id: string; action_type: string; agent_key: string;
  recommendation_summary: string | null; estimated_pnl_usd: number | null;
  confidence_pct: number | null; regulatory_tier: string;
  approved: boolean; created_at: string;
}
export interface ArtemisComplianceEvent {
  id: string; framework: string; status: string; detail: string;
  jurisdiction: string | null; agent_key: string | null; created_at: string;
}
export interface ArbitrageOpportunity {
  id: string; spread_name: string; spread_type: string; leg_a: string; leg_b: string;
  current_level: string; current_level_numeric: number; percentile_rank: number;
  estimated_pnl_usd: number; execution_window: string; confidence_pct: number;
  status: string; regulatory_tier: string; approved_by: string | null;
  approved_at: string | null; created_at: string;
}
export interface ArbitrageMetric {
  id: string; metric_date: string; spreads_monitored: number;
  opportunities_detected: number; opportunities_approved: number;
  total_pnl_identified_usd: number; total_pnl_realised_usd: number;
  avg_signal_latency_seconds: number;
}
export interface BaseOilPrice {
  id: string; grade: string; price_per_mt: number; price_display: string;
  change_pct: number; change_display: string; alert_status: string; price_date: string;
}
export interface CastrolPricingRec {
  id: string; sku_code: string; sku_name: string; segment: string; geography: string;
  current_display: string; recommended_display: string; margin_impact_pct: number;
  margin_impact_display: string; rec_status: string; confidence_pct: number;
  competitor_benchmark: string | null; is_intraday_update: boolean; generated_at: string;
}
export interface AviationForecast {
  id: string; iata_code: string; airport_name: string | null;
  d30_display: string; d90_display: string; d90_delta_pct: number;
  d90_delta_display: string; confidence_interval_pct: number;
  model_mape_pct: number; forecast_date: string;
}
export interface AviationContract {
  id: string; iata_code: string; airline: string; contract_type: string;
  status: string; days_to_renewal: number; contract_value_usd: number | null;
  recommended_structure: string | null; scenario_baseline_usd: number | null;
  pack_generated_at: string | null;
}
export interface CarbonPosition {
  id: string; credit_type: string; credit_category: string;
  holdings_display: string; obligation_display: string;
  net_position_tonnes: number; net_position_display: string;
  price_display: string; market_value_usd: number | null; position_date: string;
}
export interface CarbonRecommendation {
  id: string; credit_type: string; action: string; urgency: string;
  quantity_tonnes: number | null; expected_cost_benefit_usd: number | null;
  rationale: string; status: string; created_at: string;
}
