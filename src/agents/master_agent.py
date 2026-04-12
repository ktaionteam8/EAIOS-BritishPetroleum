"""
Master Agent (Orchestrator)
=============================
Combines decisions from 7 representative domain services into a single
enterprise-level recommendation with composable rule logic.
"""

from datetime import datetime, timezone
from typing import Any

from src.services.orchestrator import gather_domain_decisions


class MasterAgent:
    AGENT_NAME = "MasterAgent"

    def __init__(self) -> None:
        self.domain_inputs: dict[str, dict[str, Any]] = {}

    def _refresh(self) -> None:
        self.domain_inputs = gather_domain_decisions()

    def _top(self, domain: str) -> str:
        return self.domain_inputs.get(domain, {}).get("top_decision", "UNKNOWN")

    def _evaluate(self) -> dict[str, Any]:
        mfg = self._top("manufacturing")
        scm = self._top("supply_chain")
        trade = self._top("trading")
        treasury = self._top("finance_treasury")
        tax = self._top("finance_tax")
        it_ot = self._top("it_ot")
        hr_safety = self._top("hr_safety")

        actions: list[str] = []
        triggered_rules: list[str] = []
        reasons: list[str] = []

        # -- Safety / compliance first (can override everything else) --
        if tax in ("NON_COMPLIANT", "VIOLATION"):
            triggered_rules.append("COMPLIANCE_VIOLATION")
            actions.append("Stop affected operations; engage tax/legal remediation")
            reasons.append(f"Tax compliance flagged {tax}")

        if it_ot in ("CRITICAL", "ALERT"):
            triggered_rules.append("OT_SECURITY_CRITICAL")
            actions.append("Isolate affected OT assets; escalate to SOC")
            reasons.append(f"OT security status {it_ot}")

        if hr_safety in ("ALERT", "CRITICAL"):
            triggered_rules.append("HR_SAFETY_ALERT")
            actions.append("Trigger HSE response; suspend high-risk tasks")
            reasons.append(f"Safety status {hr_safety}")

        # -- Operational intelligence (combine manufacturing + supply chain) --
        maintenance_high = mfg in ("HIGH_RISK", "CRITICAL", "FAILURE_LIKELY")
        inventory_low = scm in ("STOCKOUT_RISK", "CRITICAL", "BELOW_SAFETY", "WARNING")
        if maintenance_high and inventory_low:
            triggered_rules.append("MAINTENANCE_AND_STOCKOUT")
            actions.append("Order spare parts and schedule maintenance window")
            reasons.append("Maintenance risk elevated while spare inventory is low")
        elif maintenance_high:
            triggered_rules.append("MAINTENANCE_HIGH")
            actions.append("Schedule predictive maintenance inspection")
            reasons.append("Predictive maintenance flags elevated risk")
        elif inventory_low:
            triggered_rules.append("INVENTORY_LOW")
            actions.append("Replenish inventory ahead of projected stockout")
            reasons.append("Supply chain flags stockout risk")

        # -- Commercial opportunity --
        if trade == "BUY" and treasury == "INVEST":
            triggered_rules.append("TRADE_EXECUTE")
            actions.append("Execute crude BUY trade; deploy treasury surplus")
            reasons.append("Trading signal BUY aligns with treasury INVEST")
        elif trade == "SELL" and treasury == "ALERT":
            triggered_rules.append("TRADE_LIQUIDITY")
            actions.append("Execute SELL to shore up liquidity")
            reasons.append("Trading signal SELL + treasury ALERT suggests liquidation")
        elif treasury == "ALERT":
            triggered_rules.append("LIQUIDITY_ALERT")
            actions.append("Draw credit line; defer non-critical payments")
            reasons.append("Treasury liquidity under threshold")

        # -- Final decision synthesis --
        if "COMPLIANCE_VIOLATION" in triggered_rules:
            final_decision = "STOP_OPERATIONS_COMPLIANCE"
            confidence = 0.95
        elif "OT_SECURITY_CRITICAL" in triggered_rules or "HR_SAFETY_ALERT" in triggered_rules:
            final_decision = "HALT_OPERATIONS_SAFETY"
            confidence = 0.92
        elif "MAINTENANCE_AND_STOCKOUT" in triggered_rules:
            final_decision = "ORDER_PARTS_AND_SCHEDULE_MAINTENANCE"
            confidence = 0.9
        elif "TRADE_EXECUTE" in triggered_rules:
            final_decision = "EXECUTE_TRADE"
            confidence = 0.88
        elif "LIQUIDITY_ALERT" in triggered_rules or "TRADE_LIQUIDITY" in triggered_rules:
            final_decision = "PRESERVE_LIQUIDITY"
            confidence = 0.85
        elif "MAINTENANCE_HIGH" in triggered_rules:
            final_decision = "SCHEDULE_MAINTENANCE"
            confidence = 0.8
        elif "INVENTORY_LOW" in triggered_rules:
            final_decision = "REPLENISH_INVENTORY"
            confidence = 0.78
        else:
            final_decision = "CONTINUE_NORMAL_OPS"
            confidence = 0.75
            reasons.append("All domains within acceptable bands")

        return {
            "final_decision": final_decision,
            "confidence": round(confidence, 2),
            "reason": "; ".join(reasons) if reasons else "No cross-domain alerts",
            "actions": actions,
            "triggered_rules": triggered_rules,
        }

    def run(self) -> dict[str, Any]:
        self._refresh()
        decision = self._evaluate()
        decision.update({
            "agent": self.AGENT_NAME,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "domain_inputs": {
                name: {
                    "source": payload.get("source"),
                    "top_decision": payload.get("top_decision"),
                    "actionable_count": payload.get("actionable_count"),
                }
                for name, payload in self.domain_inputs.items()
            },
        })
        return decision

    def decision_only(self) -> dict[str, Any]:
        full = self.run()
        return {
            "final_decision": full["final_decision"],
            "confidence": full["confidence"],
            "reason": full["reason"],
            "actions": full["actions"],
            "timestamp": full["timestamp"],
        }
