# it-service-desk-agent

**Domain:** IT Operations & Cybersecurity
**System:** EAIOS-BritishPetroleum — Enterprise AI Operating System for British Petroleum

## Purpose
Automates IT support ticket triage, classification, routing, and resolution using NLP and historical resolution patterns. Reduces MTTR and analyst workload.

## Structure
```
it-service-desk-agent/
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
`agent/it-service-desk-agent`

## Getting Started
```bash
# Install dependencies
pip install -r src/requirements.txt

# Run tests
pytest tests/

# Start agent (local)
python src/main.py
```
