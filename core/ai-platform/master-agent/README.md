# EAIOS Master Decision Agent

> Central AI orchestrator for the EAIOS Manufacturing Domain.

## Overview

The Master Agent aggregates structured JSON outputs from all 6 worker agents,
normalises them into a unified schema, detects cross-domain risks, and produces
a prioritised decision report — either via Claude API or a deterministic mock.

## Worker Agent Inputs

| Agent | Output File | Entity Type |
|-------|-------------|-------------|
| MaintenanceAgent | `maintenance_output.json` | machine |
| ProductionAgent | `production_output.json` | production_order |
| QualityAgent | `quality_output.json` | inspection_lot |
| DemandAgent | `demand_output.json` | product_demand |
| InventoryAgent | `inventory_output.json` | inventory_item |
| LogisticsAgent | `logistics_output.json` | shipment |

## Usage

```bash
# Mock mode (no API key needed)
python master_agent.py --input outputs/ --mock

# With Claude API
export ANTHROPIC_API_KEY=sk-...
python master_agent.py --input outputs/ --model claude-sonnet-4-20250514
```

## Data Flow

```
Worker Agents (6x) --> JSON outputs --> Master Agent --> Decision Report
                                             |
                                        Claude API (optional)
```

## Architecture

- **No direct imports** from worker agents
- Communication via JSON files or REST API
- Runs independently on `develop` branch (core layer)
- Worker agents run on their isolated application branches

## Architecture Role

- Type: Orchestration Layer (Core)
- Communication: Reads worker agent JSON outputs
- Deployment: Central service
- AI Component: Claude-powered decision synthesis
