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

- [x] **DB-01** — Run Alembic migration + check tables exist
  ```bash
  cd backend && python -m alembic upgrade head
  ```
  ⚠️ **BLOCKED in sandbox** (no network to Supabase). Run in your local env or Render shell.

- [x] **DB-02** — Run existing seed scripts against Supabase
  ```bash
  cd backend
  python seed_09a_sites_users.py
  python seed_09b_equipment.py
  python seed_09c_alerts.py
  python seed_09d_workorders_parts.py
  python seed_09e_ml_models.py
  ```
  ⚠️ **BLOCKED in sandbox**. Run in your local env. Each script is idempotent.

- [x] **DB-03a** — `backend/seed_10a_specialty.py` ✅ COMMITTED
  Seeds: offshore_platforms (3) + subsea_alerts (4) + well_integrity (4)
       + blend_specifications (3) + blend_runs (3) + blend_quality_predictions (3)
       + digital_twin_assets (3) + operating_envelope_params (4) + twin_scenarios (3)

- [x] **DB-03b** — `backend/seed_10b_adoption_wave_edge.py` ✅ COMMITTED
  Seeds: adoption_metrics (5) + training_modules (4) + adoption_barriers (4) + change_champions (3)
       + implementation_waves (3) + wave_milestones (4) + delivery_risks (3)
       + edge_nodes (3) + edge_model_deployments (3) + latency_benchmarks (3)

- [x] **DB-03c** — `backend/seed_10c_ops_compliance.py` ✅ COMMITTED
  Seeds: compliance_standards (3) + compliance_audits (3) + compliance_actions (3)
       + inspection_routes (3) + inspection_items (3) + contractors (3)
       + energy_readings (5) + energy_targets +2 + energy_saving_events (3)
       + ot_data_sources (3) + ot_quality_issues (3)
       + turnaround_events (2) + tar_tasks (4) + tar_constraints (3)
       + kpi_snapshots +2 + cost_saving_events (3) + roi_contributions (3)

- [x] **DB-04** — `backend/validate_db.py` ✅ COMMITTED
  Auto-discovers all tables from SQLAlchemy metadata, runs SELECT COUNT(*) for each,
  prints aligned pass/fail report. Exit code 0 = all pass.
  ```bash
  cd backend && python validate_db.py
  ```

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

---

## Enhancement 3 Review — 2026-04-13

### What was done
- **DB-03a** `seed_10a_specialty.py` — seeds 9 specialty tables (offshore, Castrol, digital twin). Committed & pushed.
- **DB-03b** `seed_10b_adoption_wave_edge.py` — seeds 10 tables (adoption, wave tracker, edge AI). Committed & pushed.
- **DB-03c** `seed_10c_ops_compliance.py` — seeds 16 tables across compliance, field ops, energy, OT data, TAR, ROI. Committed & pushed.
- **DB-04** `validate_db.py` — auto-discovers all tables from SQLAlchemy metadata, SELECT COUNT(*) for each, aligned pass/fail report. Committed & pushed.

### What to run (in your Supabase-connected environment)
```bash
cd backend
python -m alembic upgrade head          # DB-01
python seed_09a_sites_users.py          # DB-02
python seed_09b_equipment.py
python seed_09c_alerts.py
python seed_09d_workorders_parts.py
python seed_09e_ml_models.py
python seed_10a_specialty.py            # DB-03a
python seed_10b_adoption_wave_edge.py   # DB-03b
python seed_10c_ops_compliance.py       # DB-03c
python validate_db.py                   # DB-04 — should show all PASS
```

### Sandbox limitation
DB-01 and DB-02 could not be executed from the sandbox — `socket.gaierror: [Errno -3] Temporary failure in name resolution` when connecting to Supabase. All seed scripts and validate_db.py are committed and ready to run in any environment with Supabase network access (local dev, Render shell, or GitHub Actions with secrets).

### DB-05/DB-06 — pending user validation run
Run `python validate_db.py` after seeding. Any FAIL rows need investigation (empty table = missing seed, ERROR = migration gap). Fixes should be committed as individual patches.
