# Todo — EAIOS British Petroleum

Track active and completed tasks for the EAIOS British Petroleum project.

---

## MASTER PLAN — 3 Enhancements (April 2026)

> Execute in order. Check in with user after each enhancement before starting the next.
> One file = one commit = one push (CLAUDE.md micro-task rule).

---

## ENHANCEMENT 1 — Live Demo Mode

**Goal:** A "Live Demo" button in RefinerAI that walks through all 20 tabs sequentially
with real or seeded data. User clicks Next/Prev to navigate. Each step shows the
feature working with a brief description of what it does.

### Full Feature Inventory (20 tabs to cover)

| # | Tab ID | Label | Data Source |
|---|--------|-------|-------------|
| 1 | `dashboard` | Dashboard | `fetchDashboard()` → stats cards |
| 2 | `live-alerts` | Live Alerts | `fetchAlerts()` → alert list + SHAP |
| 3 | `equipment-health` | Equipment Health | `fetchEquipment()` → health scores |
| 4 | `spare-parts` | Spare Parts | `fetchSpareParts()` → parts inventory |
| 5 | `ai-advisor` | AI Advisor | `fetchAiAdvisorHistory()` → recommendations |
| 6 | `ml-models` | ML Models | `fetchMLModels()` → model registry |
| 7 | `digital-twin` | Digital Twin | `fetchDigitalTwinRegistry()` → twins list |
| 8 | `reliability` | FMEA Library | `fetchFMEA()` → failure modes |
| 9 | `compliance` | Compliance | `fetchCompliance()` → audits |
| 10 | `field-ops` | Field Ops | `fetchInspectionRoutes()` → routes |
| 11 | `energy` | Energy | `fetchEnergyReadings()` → metrics |
| 12 | `tar` | TAR Planning | `fetchTAR()` → turnarounds |
| 13 | `castrol` | Castrol Blending | `fetchCastrolRuns()` → blend runs |
| 14 | `offshore` | North Sea Ops | `fetchPlatforms()` → platforms |
| 15 | `ot-data` | OT Data | `fetchOTSources()` → PI historian |
| 16 | `adoption` | Adoption | `fetchAdoptionMetrics()` → metrics |
| 17 | `wave-tracker` | Wave Tracker | `fetchWaves()` → implementation waves |
| 18 | `edge-ai` | Edge AI | `fetchEdgeNodes()` → edge nodes |
| 19 | `work-orders` | Work Orders | `fetchWorkOrders()` → WO list |
| 20 | `roi` | ROI Analytics | `fetchROIKPIs()` → KPI snapshots |

### Micro-tasks

- [ ] **DEMO-01** — `frontend/src/pages/apps/RefinerAI.tsx`
  Add `demoMode: boolean`, `demoStep: number` state + `DEMO_STEPS` constant array
  (20 entries: `{ tabId, title, description }`). Wire `demoMode` to auto-navigate
  the active tab when step changes. No UI yet — state only.

- [ ] **DEMO-02** — `frontend/src/pages/apps/RefinerAI.tsx`
  Add Live Demo button to the top header bar of RefinerAI. When clicked, sets
  `demoMode=true`, `demoStep=0`, navigates to first tab. Show a floating banner
  at bottom: step counter ("1 of 20"), tab name, description, Prev/Next/Exit buttons.
  Keep banner above existing UI.

- [ ] **DEMO-03** — `frontend/src/pages/apps/RefinerAI.tsx`
  Wire Prev/Next buttons: increment/decrement `demoStep`, set `activeTab` to
  `DEMO_STEPS[demoStep].tabId`. Auto-scroll sidebar nav item into view. Exit button
  clears `demoMode`, returns to step 0.

---

## ENHANCEMENT 2 — Remove "NEW" Badges

**Goal:** Strip all 6 NEW badges from the sidebar nav. No functionality changes.

**Exact locations (all in `RefinerAI.tsx`):**

| Line | Current code | Fix |
|------|-------------|-----|
| 5904 | `{ id: 'castrol', ..., badge: 'NEW' }` | Remove `, badge: 'NEW'` |
| 5905 | `{ id: 'offshore', ..., badge: 'NEW' }` | Remove `, badge: 'NEW'` |
| 5906 | `{ id: 'ot-data', ..., badge: 'NEW' }` | Remove `, badge: 'NEW'` |
| 5907 | `{ id: 'adoption', ..., badge: 'NEW' }` | Remove `, badge: 'NEW'` |
| 5908 | `{ id: 'wave-tracker', ..., badge: 'NEW' }` | Remove `, badge: 'NEW'` |
| 5909 | `{ id: 'edge-ai', ..., badge: 'NEW' }` | Remove `, badge: 'NEW'` |
| ~5920 | `{item.badge && <span ...>{item.badge}</span>}` | Remove entire expression |

### Micro-tasks

- [ ] **BADGE-01** — `frontend/src/pages/apps/RefinerAI.tsx`
  Remove all 6 `badge: 'NEW'` properties from the sidebar nav items array
  AND remove the `{item.badge && <span>...</span>}` render expression.
  One commit. Verify the `badge` field also disappears from the TypeScript
  nav item type if it's declared there.

---

## ENHANCEMENT 3 — Validate Supabase Database

**Goal:** Every table exists in Supabase, every feature stores data end-to-end.

### Known state
- 55 tables defined across 17 model files
- 1 Alembic migration file: `395e40c0974f_initial_schema.py`
- 5 seed scripts exist: sites/users, equipment, alerts, work_orders/parts, ml_models
- 12 tables NOT covered by existing seed scripts (see DB-03 below)
- DATABASE_URL in `.env` → Supabase `db.hnmsgojeexhyhsrlhgcv.supabase.co`

### Micro-tasks

- [ ] **DB-01** — Run Alembic migration + check tables exist
  ```bash
  cd backend && DATABASE_URL=$(grep DATABASE_URL .env | cut -d= -f2-) \
    python -m alembic upgrade head
  ```
  If tables already exist: `alembic current` reports `head` → PASS.
  If errors: fix migration and re-run.

- [ ] **DB-02** — Run existing seed scripts against Supabase
  ```bash
  cd backend
  python seed_09a_sites_users.py
  python seed_09b_equipment.py
  python seed_09c_alerts.py
  python seed_09d_workorders_parts.py
  python seed_09e_ml_models.py
  ```
  Each script is idempotent (upserts). Verify row counts after each.

- [ ] **DB-03a** — `backend/seed_10a_specialty.py`
  Seed tables not covered by existing scripts (≤150 lines):
  - `offshore_platforms` (3 rows) + `subsea_alerts` (4 rows) + `well_integrity` (4 rows)
  - `blend_specifications` (3 rows) + `blend_runs` (3 rows) + `blend_quality_predictions`
  - `digital_twin_assets` (3 rows) + `operating_envelope_params` + `twin_scenarios`

- [ ] **DB-03b** — `backend/seed_10b_adoption_wave_edge.py`
  Seed tables (≤150 lines):
  - `adoption_metrics` (5 rows) + `training_modules` (4 rows) + `adoption_barriers` + `change_champions`
  - `implementation_waves` (3 rows) + `wave_milestones` + `delivery_risks`
  - `edge_nodes` (3 rows) + `latency_benchmarks` + `edge_model_deployments`

- [ ] **DB-03c** — `backend/seed_10c_ops_compliance.py`
  Seed remaining tables (≤150 lines):
  - `compliance_standards` (3 rows) + `compliance_audits` + `compliance_actions`
  - `inspection_routes` (3 rows) + `inspection_items` + `contractors`
  - `energy_readings` (5 rows) + `energy_targets` + `energy_saving_events`
  - `ot_data_sources` (3 rows) + `ot_quality_issues`
  - `turnaround_events` (2 rows) + `tar_tasks` + `tar_constraints`
  - `kpi_snapshots` (additional if missing) + `cost_saving_events` + `roi_contributions`

- [ ] **DB-04** — `backend/validate_db.py`
  Write a validation script that:
  1. Connects to Supabase
  2. For each of the 55 tables: SELECT COUNT(*) → report pass/fail
  3. Prints a table: `table_name | row_count | status`
  Commit and run. Fix any zero-count tables.

- [ ] **DB-05** — Fix any broken end-to-end flows
  After DB-04 reveals gaps, fix specific issues:
  - Missing FK references (e.g. `wave_milestones.owner_id` → valid `users.id`)
  - API endpoints returning empty lists when DB has data (check router queries)
  - Any SQLAlchemy model vs actual table mismatch (column names, types)
  Each fix = separate commit.

- [ ] **DB-06** — Final validation report
  Re-run `validate_db.py`. Every table must show row_count ≥ 1.
  Document results in this file under Review section.

---

## Sequence

```
Enhancement 1: DEMO-01 → DEMO-02 → DEMO-03 → CHECK IN
Enhancement 2: BADGE-01 → CHECK IN
Enhancement 3: DB-01 → DB-02 → DB-03a → DB-03b → DB-03c → DB-04 → DB-05 → DB-06 → CHECK IN
```

---

<!-- Add task reviews below this line as each enhancement completes -->
