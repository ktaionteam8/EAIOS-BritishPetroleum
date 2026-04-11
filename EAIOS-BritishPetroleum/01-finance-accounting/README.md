# 01 — Finance & Accounting

**Domain:** Finance & Accounting
**System:** EAIOS-BritishPetroleum

## Overview
AI agents for automating financial operations, compliance, forecasting, and revenue analytics across BP's global finance function.

## Agents
| Agent | Purpose |
|---|---|
| financial-close-automation-agent | Automates period-end financial close processes |
| jv-accounting-agent | Manages Joint Venture accounting and reporting |
| cost-forecasting-agent | Predicts cost variances and budget deviations |
| tax-compliance-agent | Monitors and ensures global tax compliance |
| treasury-management-agent | Optimises cash flow and treasury operations |
| revenue-analytics-agent | Analyses revenue streams and financial performance |

## Structure
```
01-finance-accounting/
├── agents/         ← 6 AI agents (each with src/, tests/, config/)
├── applications/   ← Web/UI applications for this domain
├── services/       ← Shared microservices
└── models/         ← Shared data models and schemas
```
