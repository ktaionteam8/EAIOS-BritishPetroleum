"""
Financial Close Automation Agent
==================================
Evaluates 70 month-end close entities for CLOSE_READY / PENDING / ISSUE
based on transaction reconciliation status, pending entries, and
materiality thresholds.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.financial_close_data import generate_financial_close_data


class FinancialCloseAgent:
    AGENT_NAME = "FinancialCloseAgent"

    MATERIALITY_THRESHOLD = 25000  # USD

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_financial_close_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            recon_pct = row["reconciled_pct"]
            pending_entries = row["pending_entries"]
            unreconciled_amt = row["unreconciled_amount"]
            has_audit_flag = bool(row["audit_flag"])

            if has_audit_flag or unreconciled_amt > self.MATERIALITY_THRESHOLD * 5:
                decision = "ISSUE"
                confidence = 0.92
                reason = (f"Material exception: ${unreconciled_amt:,.0f} unreconciled"
                          + (" + audit flag" if has_audit_flag else ""))
            elif recon_pct < 0.95 or pending_entries > 5 or unreconciled_amt > self.MATERIALITY_THRESHOLD:
                decision = "PENDING"
                confidence = 0.75
                reason = (f"{recon_pct:.0%} reconciled, {pending_entries} pending entries, "
                          f"${unreconciled_amt:,.0f} unreconciled")
            else:
                decision = "CLOSE_READY"
                confidence = 0.95
                reason = f"Fully reconciled ({recon_pct:.0%}), {pending_entries} minor entries"

            results.append({
                "entity_id": row["entity_id"],
                "entity_type": "close_book",
                "business_unit": row["business_unit"],
                "period": row["period"],
                "reconciled_pct": round(recon_pct, 2),
                "pending_entries": int(pending_entries),
                "unreconciled_amount": round(unreconciled_amt, 2),
                "audit_flag": has_audit_flag,
                "decision": decision,
                "confidence": confidence,
                "reason": reason,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["decision"] != "CLOSE_READY"]
