# quality-control-agent

**Domain:** Manufacturing & Plant Operations
**System:** EAIOS-BritishPetroleum — Enterprise AI Operating System for British Petroleum

## Purpose
Monitors product quality in real-time across manufacturing processes. Detects deviations from specification, identifies root causes, and recommends corrective actions to prevent off-spec production.

## Structure
```
quality-control-agent/
├── src/        ← Agent source code
├── tests/      ← Unit and integration tests
├── config/     ← Agent configuration (env, params, secrets refs)
└── README.md   ← This file
```

## Communication Rules
- This agent communicates **exclusively via the API Gateway** (`core/api-gateway`)
- Direct inter-agent calls are **not permitted**
- All inputs/outputs are validated at the gateway boundary

## Branch Rule
All changes for this agent are developed on its own isolated branch:
`agent/quality-control-agent`

## Getting Started
```bash
# Install dependencies
pip install -r src/requirements.txt

# Run tests
pytest tests/

# Start agent (local)
python src/main.py
```
