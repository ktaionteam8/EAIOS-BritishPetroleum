# workforce-planning-agent

**Domain:** Human Resources & Safety
**System:** EAIOS-BritishPetroleum — Enterprise AI Operating System for British Petroleum

## Purpose
Forecasts headcount requirements across BP's global business units using project pipelines, attrition data, and strategic plans. Generates hiring plans and resource allocation recommendations.

## Structure
```
workforce-planning-agent/
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
`agent/workforce-planning-agent`

## Getting Started
```bash
# Install dependencies
pip install -r src/requirements.txt

# Run tests
pytest tests/

# Start agent (local)
python src/main.py
```
