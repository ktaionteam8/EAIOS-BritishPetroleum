# 06 — Supply Chain & Logistics

**Domain:** Supply Chain & Logistics
**System:** EAIOS-BritishPetroleum

## Overview
AI agents for demand-supply matching, Castrol distribution, aviation fuel logistics, marine bunkering, retail fuel optimisation, and inventory management.

## Agents
| Agent | Purpose |
|---|---|
| demand-supply-matching-agent | Balances product supply with downstream demand |
| castrol-distribution-agent | Optimises Castrol global distribution network |
| aviation-fuel-logistics-agent | Manages aviation fuel supply chain and logistics |
| marine-bunkering-agent | Optimises marine fuel supply and bunkering operations |
| retail-fuel-optimization-agent | Optimises BP retail fuel station supply and pricing |
| inventory-management-agent | Manages inventory levels across the supply chain |

## Structure
```
06-supply-chain-logistics/
├── agents/         ← 6 AI agents (each with src/, tests/, config/)
├── applications/   ← Web/UI applications for this domain
├── services/       ← Shared microservices
└── models/         ← Shared data models and schemas
```
