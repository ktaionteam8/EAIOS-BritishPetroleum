"""
Skills Gap Analysis Agent
===========================
Compares required skills per role vs current employee capability levels.
Recommends TRAIN (internal upskilling), HIRE (external sourcing), or OK.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.skills_gap_data import generate_skills_gap_data


class SkillsGapAgent:
    AGENT_NAME = "SkillsGapAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_skills_gap_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            required = row["required_level"]
            current = row["current_level"]
            gap = required - current
            trainable = row["trainable_score"]

            if gap <= 0:
                action = "OK"
                rationale = f"Skill met (current {current:.1f} >= required {required:.1f})"
                priority = "LOW"
            elif gap > 0 and trainable >= 0.6:
                action = "TRAIN"
                rationale = f"Gap {gap:.1f} levels; high trainability ({trainable:.2f}) — upskill internally"
                priority = "HIGH" if gap >= 2.0 else "MEDIUM"
            else:
                action = "HIRE"
                rationale = f"Gap {gap:.1f} levels; low trainability ({trainable:.2f}) — source externally"
                priority = "HIGH" if gap >= 2.5 else "MEDIUM"

            results.append({
                "entity_id": row["role_skill_id"],
                "entity_type": "role_skill",
                "role": row["role"],
                "skill": row["skill"],
                "required_level": round(required, 1),
                "current_level": round(current, 1),
                "gap": round(gap, 1),
                "trainable_score": round(trainable, 2),
                "headcount_affected": int(row["headcount_affected"]),
                "action": action,
                "priority": priority,
                "rationale": rationale,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["action"] != "OK"]
