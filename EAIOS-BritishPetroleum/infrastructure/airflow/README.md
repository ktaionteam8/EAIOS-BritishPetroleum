# infrastructure/airflow

Apache Airflow deployment configuration for EAIOS-BP data pipelines.

## Contents
- `dags/`          — All production DAGs (symlinked from core/data-pipelines)
- `plugins/`       — Custom Airflow operators and sensors
- `config/`        — Airflow configuration
- `connections/`   — Connection templates (no secrets — use Key Vault)

## Port: 8080
