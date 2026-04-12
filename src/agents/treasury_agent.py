"""
Treasury Management Agent
===========================
Evaluates cash positions across 50 accounts/entities. Combines cash
flow, short-term obligations, and liquidity coverage ratio to decide
INVEST (surplus), HOLD (balanced), or ALERT (shortfall risk).
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.treasury_data import generate_treasury_data


class TreasuryAgent:
    AGENT_NAME = "TreasuryAgent"

    LCR_ALERT = 1.0
    LCR_INVEST = 1.8

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_treasury_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            cash = row["cash_balance"]
            inflow = row["net_inflow_30d"]
            obligations = row["obligations_30d"]
            fx_exposure = row["fx_exposure"]

            projected_cash = cash + inflow - obligations
            lcr = (cash + inflow) / obligations if obligations > 0 else 10.0

            if lcr < self.LCR_ALERT or projected_cash < 0:
                decision = "ALERT"
                confidence = 0.9
                reason = (f"LCR {lcr:.2f} below 1.0; projected cash "
                          f"${projected_cash:,.0f} after 30d obligations")
                suggested_action = "Draw credit line / defer non-critical payments"
            elif lcr >= self.LCR_INVEST and fx_exposure < 0.25:
                decision = "INVEST"
                confidence = 0.85
                reason = f"Surplus liquidity (LCR {lcr:.2f}); low FX exposure"
                suggested_action = f"Deploy ${projected_cash * 0.3:,.0f} to short-term instruments"
            else:
                decision = "HOLD"
                confidence = 0.8
                reason = f"Balanced position (LCR {lcr:.2f}, FX exp {fx_exposure:.1%})"
                suggested_action = "Maintain current allocation"

            results.append({
                "entity_id": row["account_id"],
                "entity_type": "treasury_account",
                "entity_name": row["entity_name"],
                "currency": row["currency"],
                "cash_balance": round(cash, 0),
                "net_inflow_30d": round(inflow, 0),
                "obligations_30d": round(obligations, 0),
                "projected_cash_30d": round(projected_cash, 0),
                "liquidity_coverage_ratio": round(lcr, 2),
                "fx_exposure": round(fx_exposure, 2),
                "decision": decision,
                "confidence": confidence,
                "reason": reason,
                "suggested_action": suggested_action,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["decision"] != "HOLD"]
