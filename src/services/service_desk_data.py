"""Synthetic IT service desk ticket data."""

import pandas as pd
import numpy as np


def generate_service_desk_data(seed: int = 71) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 100

    categories = ["password_reset", "vpn_connect", "printer", "mailbox_quota",
                  "software_install", "laptop_issue", "server_outage", "db_error",
                  "phishing", "access_request", "network_slow"]
    teams = ["network", "application", "security", "hardware", "identity"]
    severities = rng.choice(["P1", "P2", "P3", "P4"], n, p=[0.05, 0.15, 0.50, 0.30])

    return pd.DataFrame({
        "ticket_id": [f"TKT-{i:06d}" for i in range(n)],
        "category": rng.choice(categories, n),
        "severity": severities,
        "team": rng.choice(teams, n),
        "vip_user": rng.random(n) < 0.08,
        "sla_hours": rng.choice([1, 4, 8, 24], n, p=[0.1, 0.25, 0.40, 0.25]),
    })
