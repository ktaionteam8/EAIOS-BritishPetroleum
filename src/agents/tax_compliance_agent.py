"""
Tax Compliance Agent
======================
Validates 100 cross-border and domestic transactions against regional
tax rules (VAT, withholding, corporate income, excise, carbon).
Produces COMPLIANT / RISK / NON_COMPLIANT decisions.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.tax_compliance_data import generate_tax_compliance_data


class TaxComplianceAgent:
    AGENT_NAME = "TaxComplianceAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_tax_compliance_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            expected_rate = row["expected_tax_rate"]
            applied_rate = row["applied_tax_rate"]
            amount = row["transaction_amount"]
            filing_ok = bool(row["documentation_complete"])
            rate_diff = applied_rate - expected_rate

            tax_gap = abs(rate_diff) * amount

            if not filing_ok or abs(rate_diff) > 0.03:
                decision = "NON_COMPLIANT"
                confidence = 0.92
                reason = (f"Applied {applied_rate:.2%} vs expected {expected_rate:.2%} "
                          f"(gap ${tax_gap:,.0f})"
                          + ("; documentation incomplete" if not filing_ok else ""))
            elif abs(rate_diff) > 0.005:
                decision = "RISK"
                confidence = 0.75
                reason = f"Rate drift {rate_diff:+.2%}; estimated gap ${tax_gap:,.0f}"
            else:
                decision = "COMPLIANT"
                confidence = 0.95
                reason = f"Rate matches regional rule ({applied_rate:.2%})"

            results.append({
                "entity_id": row["txn_id"],
                "entity_type": "tax_transaction",
                "region": row["region"],
                "tax_type": row["tax_type"],
                "transaction_amount": round(amount, 2),
                "expected_tax_rate": round(expected_rate, 4),
                "applied_tax_rate": round(applied_rate, 4),
                "rate_diff": round(rate_diff, 4),
                "estimated_tax_gap": round(tax_gap, 2),
                "documentation_complete": filing_ok,
                "decision": decision,
                "confidence": confidence,
                "reason": reason,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["decision"] != "COMPLIANT"]
