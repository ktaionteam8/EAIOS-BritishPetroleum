# 02 — Human Resources & Safety

**Domain:** Human Resources & Safety
**System:** EAIOS-BritishPetroleum

## Overview
AI agents for workforce planning, talent analytics, safety incident prediction, and managing BP's energy transition workforce programme.

## Agents
| Agent | Purpose |
|---|---|
| workforce-planning-agent | Forecasts headcount needs across business units |
| skills-gap-analysis-agent | Identifies capability gaps and training needs |
| talent-analytics-agent | Analyses talent pipeline and retention risk |
| safety-incident-prediction-agent | Predicts HSE incidents before they occur |
| contractor-management-agent | Manages contractor lifecycle and compliance |
| energy-transition-reskilling-agent | Plans workforce reskilling for net-zero transition |

## Structure
```
02-human-resources-safety/
├── agents/         ← 6 AI agents (each with src/, tests/, config/)
├── applications/   ← Web/UI applications for this domain
├── services/       ← Shared microservices
└── models/         ← Shared data models and schemas
```
