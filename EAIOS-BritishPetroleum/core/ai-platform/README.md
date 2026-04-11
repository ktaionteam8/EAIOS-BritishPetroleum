# core/ai-platform

Central AI/ML platform services for EAIOS-BP.

## Contents
- `model-registry/`   — Versioned model storage and serving
- `feature-store/`    — Shared feature engineering pipelines
- `inference/`        — Model inference API wrappers
- `training/`         — Training job orchestration
- `monitoring/`       — Model drift and performance tracking

## Stack
- Model serving: FastAPI + ONNX Runtime
- Feature store: Feast
- Training: Airflow DAGs → GPU cluster
- Registry: MLflow
