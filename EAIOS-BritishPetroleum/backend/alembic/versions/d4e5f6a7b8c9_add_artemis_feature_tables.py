"""Add Artemis feature tables: trades, risk, counterparty, ETS, Castrol sim, vessels, price alerts."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "artemis_trades",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("opportunity_id", sa.String(100), nullable=False),
        sa.Column("commodity", sa.String(100), nullable=False),
        sa.Column("trade_type", sa.String(50), nullable=False),
        sa.Column("volume_bbl", sa.Float(), nullable=False),
        sa.Column("entry_price", sa.Float(), nullable=False),
        sa.Column("exit_price", sa.Float(), nullable=True),
        sa.Column("currency", sa.String(10), nullable=False, server_default="USD"),
        sa.Column("status", sa.String(50), nullable=False, server_default="open"),
        sa.Column("approved_by", sa.String(255), nullable=False),
        sa.Column("ai_confidence", sa.Float(), nullable=False),
        sa.Column("realised_pnl_usd", sa.Float(), nullable=True),
        sa.Column("unrealised_pnl_usd", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("trade_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("settlement_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_artemis_trades_opportunity_id", "artemis_trades", ["opportunity_id"])
    op.create_index("ix_artemis_trades_commodity", "artemis_trades", ["commodity"])
    op.create_index("ix_artemis_trades_status", "artemis_trades", ["status"])
    op.create_index("ix_artemis_trades_trade_date", "artemis_trades", ["trade_date"])

    op.create_table(
        "artemis_position_limits",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("commodity", sa.String(100), nullable=False),
        sa.Column("desk", sa.String(100), nullable=False),
        sa.Column("limit_usd", sa.Float(), nullable=False),
        sa.Column("current_exposure_usd", sa.Float(), nullable=False, server_default="0"),
        sa.Column("utilisation_pct", sa.Float(), nullable=False, server_default="0"),
        sa.Column("is_breached", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_artemis_position_limits_commodity", "artemis_position_limits", ["commodity"])

    op.create_table(
        "artemis_var_snapshots",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("snapshot_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("portfolio", sa.String(100), nullable=False),
        sa.Column("var_1d_95_usd", sa.Float(), nullable=False),
        sa.Column("var_1d_99_usd", sa.Float(), nullable=False),
        sa.Column("var_10d_95_usd", sa.Float(), nullable=False),
        sa.Column("cvar_usd", sa.Float(), nullable=False),
        sa.Column("gross_exposure_usd", sa.Float(), nullable=False),
        sa.Column("net_exposure_usd", sa.Float(), nullable=False),
        sa.Column("method", sa.String(50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_artemis_var_snapshots_snapshot_date", "artemis_var_snapshots", ["snapshot_date"])
    op.create_index("ix_artemis_var_snapshots_portfolio", "artemis_var_snapshots", ["portfolio"])

    op.create_table(
        "artemis_counterparties",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("counterparty_type", sa.String(50), nullable=False),
        sa.Column("credit_rating", sa.String(20), nullable=True),
        sa.Column("credit_limit_usd", sa.Float(), nullable=False),
        sa.Column("current_exposure_usd", sa.Float(), nullable=False, server_default="0"),
        sa.Column("country", sa.String(100), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("relationship_manager", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_artemis_counterparties_name", "artemis_counterparties", ["name"])
    op.create_index("ix_artemis_counterparties_type", "artemis_counterparties", ["counterparty_type"])

    op.create_table(
        "artemis_counterparty_contracts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("counterparty_id", UUID(as_uuid=True), nullable=False),
        sa.Column("contract_reference", sa.String(100), nullable=False),
        sa.Column("commodity", sa.String(100), nullable=False),
        sa.Column("contract_value_usd", sa.Float(), nullable=True),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expiry_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("days_to_expiry", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(50), nullable=False, server_default="active"),
        sa.Column("renewal_recommended", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_artemis_counterparty_contracts_counterparty_id", "artemis_counterparty_contracts", ["counterparty_id"])
    op.create_index("ix_artemis_counterparty_contracts_ref", "artemis_counterparty_contracts", ["contract_reference"])
    op.create_index("ix_artemis_counterparty_contracts_expiry", "artemis_counterparty_contracts", ["expiry_date"])

    op.create_table(
        "artemis_ets_deadlines",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("scheme", sa.String(50), nullable=False),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("deadline_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("days_remaining", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("compliance_year", sa.Integer(), nullable=False),
        sa.Column("allowances_required", sa.Float(), nullable=True),
        sa.Column("allowances_held", sa.Float(), nullable=True),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("priority", sa.String(20), nullable=False, server_default="medium"),
        sa.Column("responsible_team", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_artemis_ets_deadlines_scheme", "artemis_ets_deadlines", ["scheme"])
    op.create_index("ix_artemis_ets_deadlines_date", "artemis_ets_deadlines", ["deadline_date"])

    op.create_table(
        "artemis_ets_surrender_events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("scheme", sa.String(50), nullable=False),
        sa.Column("compliance_year", sa.Integer(), nullable=False),
        sa.Column("verified_emissions_t", sa.Float(), nullable=False),
        sa.Column("allowances_surrendered", sa.Float(), nullable=False),
        sa.Column("surplus_deficit_t", sa.Float(), nullable=False),
        sa.Column("avg_price_eur", sa.Float(), nullable=False),
        sa.Column("total_cost_eur", sa.Float(), nullable=False),
        sa.Column("surrender_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_artemis_ets_surrender_scheme", "artemis_ets_surrender_events", ["scheme"])
    op.create_index("ix_artemis_ets_surrender_year", "artemis_ets_surrender_events", ["compliance_year"])

    op.create_table(
        "artemis_castrol_simulations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("simulation_name", sa.String(255), nullable=False),
        sa.Column("created_by", sa.String(255), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="draft"),
        sa.Column("sku_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("market_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("avg_price_change_pct", sa.Float(), nullable=False, server_default="0"),
        sa.Column("projected_margin_impact_usd", sa.Float(), nullable=False, server_default="0"),
        sa.Column("projected_volume_impact_pct", sa.Float(), nullable=False, server_default="0"),
        sa.Column("approved_by", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_artemis_castrol_simulations_name", "artemis_castrol_simulations", ["simulation_name"])
    op.create_index("ix_artemis_castrol_simulations_created_by", "artemis_castrol_simulations", ["created_by"])
    op.create_index("ix_artemis_castrol_simulations_status", "artemis_castrol_simulations", ["status"])

    op.create_table(
        "artemis_castrol_sim_lines",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("simulation_id", UUID(as_uuid=True), nullable=False),
        sa.Column("sku_code", sa.String(100), nullable=False),
        sa.Column("sku_name", sa.String(255), nullable=False),
        sa.Column("geography", sa.String(100), nullable=False),
        sa.Column("current_price", sa.Float(), nullable=False),
        sa.Column("proposed_price", sa.Float(), nullable=False),
        sa.Column("change_pct", sa.Float(), nullable=False),
        sa.Column("current_margin_pct", sa.Float(), nullable=False),
        sa.Column("projected_margin_pct", sa.Float(), nullable=False),
        sa.Column("volume_elasticity", sa.Float(), nullable=False, server_default="-0.3"),
        sa.Column("projected_volume_change_pct", sa.Float(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_artemis_castrol_sim_lines_sim_id", "artemis_castrol_sim_lines", ["simulation_id"])

    op.create_table(
        "artemis_vessels",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("vessel_name", sa.String(255), nullable=False),
        sa.Column("imo_number", sa.String(20), nullable=False),
        sa.Column("vessel_type", sa.String(50), nullable=False),
        sa.Column("flag", sa.String(100), nullable=False),
        sa.Column("dwt_tonnes", sa.Float(), nullable=True),
        sa.Column("linked_trade_id", UUID(as_uuid=True), nullable=True),
        sa.Column("cargo_type", sa.String(100), nullable=True),
        sa.Column("cargo_volume", sa.Float(), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="at_sea"),
        sa.Column("current_lat", sa.Float(), nullable=True),
        sa.Column("current_lon", sa.Float(), nullable=True),
        sa.Column("current_port", sa.String(255), nullable=True),
        sa.Column("destination_port", sa.String(255), nullable=True),
        sa.Column("eta", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_ais_update", sa.DateTime(timezone=True), nullable=True),
        sa.Column("speed_knots", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_artemis_vessels_name", "artemis_vessels", ["vessel_name"])
    op.create_index("ix_artemis_vessels_imo", "artemis_vessels", ["imo_number"], unique=True)
    op.create_index("ix_artemis_vessels_status", "artemis_vessels", ["status"])
    op.create_index("ix_artemis_vessels_linked_trade", "artemis_vessels", ["linked_trade_id"])

    op.create_table(
        "artemis_price_alerts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("alert_name", sa.String(255), nullable=False),
        sa.Column("commodity", sa.String(100), nullable=False),
        sa.Column("threshold_type", sa.String(50), nullable=False),
        sa.Column("threshold_value", sa.Float(), nullable=False),
        sa.Column("current_value", sa.Float(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_triggered", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("notification_sent", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("recipients", sa.Text(), nullable=False),
        sa.Column("triggered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.String(255), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_artemis_price_alerts_name", "artemis_price_alerts", ["alert_name"])
    op.create_index("ix_artemis_price_alerts_commodity", "artemis_price_alerts", ["commodity"])
    op.create_index("ix_artemis_price_alerts_triggered", "artemis_price_alerts", ["is_triggered"])

    op.create_table(
        "artemis_alert_events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("alert_id", UUID(as_uuid=True), nullable=False),
        sa.Column("commodity", sa.String(100), nullable=False),
        sa.Column("threshold_value", sa.Float(), nullable=False),
        sa.Column("triggered_value", sa.Float(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("notification_sent", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("recipients_notified", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_artemis_alert_events_alert_id", "artemis_alert_events", ["alert_id"])


def downgrade() -> None:
    op.drop_table("artemis_alert_events")
    op.drop_table("artemis_price_alerts")
    op.drop_table("artemis_vessels")
    op.drop_table("artemis_castrol_sim_lines")
    op.drop_table("artemis_castrol_simulations")
    op.drop_table("artemis_ets_surrender_events")
    op.drop_table("artemis_ets_deadlines")
    op.drop_table("artemis_counterparty_contracts")
    op.drop_table("artemis_counterparties")
    op.drop_table("artemis_var_snapshots")
    op.drop_table("artemis_position_limits")
    op.drop_table("artemis_trades")
