# aviation-fuel-logistics-agent

**Domain:** Supply Chain & Logistics
**System:** EAIOS-BritishPetroleum — Enterprise AI Operating System for British Petroleum

## Purpose
Manages the end-to-end aviation fuel supply chain from refinery to airport hydrant. Optimises product routing, tankage utilisation, into-plane contracts, and emergency supply contingencies.

## Structure
```
aviation-fuel-logistics-agent/
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
`agent/aviation-fuel-logistics-agent`

## Getting Started
```bash
# Install dependencies
pip install -r src/requirements.txt

# Run tests
pytest tests/

# Start agent (local)
python src/main.py
```
