# energy-efficiency-agent

**Domain:** Manufacturing & Plant Operations
**System:** EAIOS-BritishPetroleum — Enterprise AI Operating System for British Petroleum

## Purpose
Optimises energy consumption across BP's plant operations by analysing steam, power, fuel gas, and cooling water usage patterns. Identifies and quantifies efficiency opportunities aligned with decarbonisation targets.

## Structure
```
energy-efficiency-agent/
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
`agent/energy-efficiency-agent`

## Getting Started
```bash
# Install dependencies
pip install -r src/requirements.txt

# Run tests
pytest tests/

# Start agent (local)
python src/main.py
```
