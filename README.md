# 03 — IT Operations: Threat Detection

> **Domain:** IT Operations & Cybersecurity  
> **Application:** threat-detection  
> **Branch:** `03-it-operations-threat-detection`  
> **Architecture:** Microservice (branch-isolated)

## Description

Analyzes 150 security events across brute force, lateral movement, data
exfiltration, DNS beaconing, SQL injection, and phishing categories.
Combines anomaly score, IOC match count, and source reputation into a
composite threat score.

### Agent Role

**ThreatDetectionAgent**:
- **THREAT** when threat_score ≥ 0.7 or IOC matches ≥ 3 → BLOCK_AND_INVESTIGATE
- **SUSPICIOUS** when threat_score ≥ 0.4 or ≥ 1 IOC → INVESTIGATE
- **BENIGN** otherwise → LOG

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full scan of 150 events |
| GET | `/api/decision` | THREAT + SUSPICIOUS events requiring SOC action |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8042
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
