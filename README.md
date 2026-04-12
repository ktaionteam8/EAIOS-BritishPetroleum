# 01 — Finance: Tax Compliance

> **Domain:** Finance & Accounting  
> **Application:** tax-compliance  
> **Branch:** `01-finance-tax-compliance`  
> **Architecture:** Microservice (branch-isolated)

## Description

Validates 100 cross-border and domestic transactions against regional
tax rules (VAT, Corporate, Withholding, Carbon) for UK, US, Germany,
India, UAE, Singapore, and Brazil.

### Agent Role

**TaxComplianceAgent**:
- **NON_COMPLIANT** when rate difference > 3% OR documentation incomplete
- **RISK** when rate drift > 0.5% (potential exposure)
- **COMPLIANT** when rate matches regional rule

Standard output: `{decision, confidence, reason, estimated_tax_gap}`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full compliance check + total estimated gap |
| GET | `/api/decision` | Non-compliant + risk transactions |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8054
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
