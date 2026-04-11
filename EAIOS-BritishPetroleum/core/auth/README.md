# core/auth

Centralised authentication and authorisation service for EAIOS-BP.

## Contents
- `jwt/`          — JWT token issuance and validation
- `rbac/`         — Role-based access control definitions
- `oauth2/`       — OAuth2 provider integrations (Azure AD)
- `api-keys/`     — API key lifecycle management
- `audit/`        — Auth event audit trail

## Stack
- FastAPI
- Azure Active Directory (OIDC)
- PostgreSQL (user/role store)
