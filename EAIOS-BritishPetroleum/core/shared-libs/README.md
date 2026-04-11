# core/shared-libs

Shared Python/TypeScript libraries used across all EAIOS-BP agents and services.

## Contents
- `auth/`        — JWT, OAuth2, and API key utilities
- `logging/`     — Structured logging with correlation IDs
- `models/`      — Shared Pydantic data models
- `utils/`       — Common helper functions
- `testing/`     — Shared test fixtures and mocks

## Usage
All agents import from this library. Changes here affect all domains — review carefully before merging.
