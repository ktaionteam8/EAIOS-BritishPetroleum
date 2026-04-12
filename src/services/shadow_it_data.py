"""Synthetic shadow IT application inventory data."""

import pandas as pd
import numpy as np


def generate_shadow_it_data(seed: int = 74) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 85

    apps = ["Notion", "ChatGPT", "Slack (personal)", "WeTransfer", "Dropbox",
            "Trello", "Figma", "Loom", "Grammarly", "Calendly", "Airtable",
            "Canva", "Discord", "Zapier", "Monday", "Asana", "DeepL",
            "Evernote", "Mural", "Perplexity"]
    categories = ["Productivity", "AI/ML", "File Transfer", "Design", "Collaboration",
                  "Automation", "Communication"]

    users = rng.integers(2, 300, n)
    data_sens = rng.uniform(0.05, 0.9, n)
    comp_risk = rng.uniform(0.1, 0.85, n)
    vendor_risk = rng.uniform(0.1, 0.9, n)
    has_alt = rng.random(n) < 0.45

    return pd.DataFrame({
        "app_id": [f"APP-{i:04d}" for i in range(n)],
        "app_name": rng.choice(apps, n),
        "category": rng.choice(categories, n),
        "active_users": users,
        "data_sensitivity": data_sens,
        "compliance_risk": comp_risk,
        "vendor_risk_score": vendor_risk,
        "sanctioned_alternative_exists": has_alt,
    })
