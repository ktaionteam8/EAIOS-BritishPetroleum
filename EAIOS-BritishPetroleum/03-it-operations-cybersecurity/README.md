# 03 — IT Operations & Cybersecurity

**Domain:** IT Operations & Cybersecurity
**System:** EAIOS-BritishPetroleum

## Overview
AI agents for IT service automation, threat detection, OT/ICS security monitoring, infrastructure observability, and compliance management.

## Agents
| Agent | Purpose |
|---|---|
| it-service-desk-agent | Automates IT support ticket triage and resolution |
| threat-detection-agent | Detects cyber threats across IT and OT networks |
| ot-security-monitoring-agent | Monitors operational technology (ICS/SCADA) security |
| shadow-it-rationalization-agent | Discovers and governs unsanctioned IT usage |
| infrastructure-monitoring-agent | Monitors infrastructure health and performance |
| compliance-management-agent | Tracks IT compliance posture and policy adherence |

## Structure
```
03-it-operations-cybersecurity/
├── agents/         ← 6 AI agents (each with src/, tests/, config/)
├── applications/   ← Web/UI applications for this domain
├── services/       ← Shared microservices
└── models/         ← Shared data models and schemas
```
