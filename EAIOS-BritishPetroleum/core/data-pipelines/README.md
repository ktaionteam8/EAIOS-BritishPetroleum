# core/data-pipelines

Shared Apache Airflow DAGs and data pipeline utilities for EAIOS-BP.

## Contents
- `ingestion/`    — Source system connectors (SAP, OSIsoft PI, market data)
- `transforms/`   — Common data transformation utilities
- `dags/`         — Shared Airflow DAGs
- `schemas/`      — Source-to-target schema mappings

## Stack
- Orchestration: Apache Airflow 2.9
- Storage: PostgreSQL + S3/Azure Data Lake
- Streaming: Kafka
