"""Synthetic compliance control evaluation data."""

import pandas as pd
import numpy as np


def generate_compliance_data(seed: int = 76) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 100

    frameworks = ["NIST CSF", "ISO 27001", "SOX", "GDPR", "NERC CIP", "IEC 62443", "PCI DSS"]
    controls = ["Access Control", "Encryption at Rest", "Encryption in Transit",
                "MFA Enforcement", "Vulnerability Scanning", "Patch Management",
                "Audit Logging", "Backup Integrity", "Incident Response Plan",
                "Third-Party Risk", "Data Classification", "Change Management",
                "Privileged Access", "Network Segmentation", "Secure Development"]

    coverage = rng.uniform(0.35, 1.0, n)
    evidence_age = rng.integers(5, 500, n)
    severity = rng.choice([0, 1, 2, 3, 4, 5], n, p=[0.35, 0.25, 0.15, 0.12, 0.08, 0.05])

    violation_mask = rng.random(n) < 0.1
    coverage[violation_mask] = rng.uniform(0.25, 0.55, violation_mask.sum())
    severity[violation_mask] = rng.integers(3, 6, violation_mask.sum())

    return pd.DataFrame({
        "control_id": [f"CTL-{i:04d}" for i in range(n)],
        "framework": rng.choice(frameworks, n),
        "control_name": rng.choice(controls, n),
        "required_by_regulator": rng.random(n) < 0.45,
        "control_coverage": coverage,
        "evidence_age_days": evidence_age,
        "finding_severity": severity,
    })
