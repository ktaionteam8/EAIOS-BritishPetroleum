# cross-commodity-arbitrage-agent

**Domain:** Commercial & Trading
**System:** EAIOS-BritishPetroleum — Enterprise AI Operating System for British Petroleum

## Purpose
Identifies and quantifies arbitrage opportunities across BP's commodity portfolio (crude, gas, power, carbon). Analyses price spreads, logistics costs, and execution risk to surface profitable trades.

## Structure
```
cross-commodity-arbitrage-agent/
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
`agent/cross-commodity-arbitrage-agent`

## Getting Started
```bash
# Install dependencies
pip install -r src/requirements.txt

# Run tests
pytest tests/

# Start agent (local)
python src/main.py
```
