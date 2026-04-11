-- ─────────────────────────────────────────────────────────────────────────────
-- Refiner AI — Database Schema
-- PostgreSQL (Supabase cloud)
-- ─────────────────────────────────────────────────────────────────────────────

-- Enum types
CREATE TYPE site_status   AS ENUM ('healthy', 'warning', 'critical');
CREATE TYPE ai_status     AS ENUM ('CRITICAL', 'WARNING', 'ADVISORY', 'HEALTHY', 'MONITORING');
CREATE TYPE action_type   AS ENUM ('Dispatch', 'Schedule', 'Monitor', 'Inspect');
CREATE TYPE alert_severity AS ENUM ('critical', 'warning', 'advisory');
CREATE TYPE wo_priority   AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE wo_status     AS ENUM ('open', 'in-progress', 'completed', 'cancelled');
CREATE TYPE model_status  AS ENUM ('active', 'training', 'deprecated');
CREATE TYPE stock_status  AS ENUM ('in-stock', 'low-stock', 'out-of-stock', 'on-order');

-- ── Refineries ────────────────────────────────────────────────────────────────
CREATE TABLE refiner_ai_refineries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255)  NOT NULL,
    location        VARCHAR(255)  NOT NULL,
    country         VARCHAR(100)  NOT NULL,
    lat             FLOAT         NOT NULL,
    lng             FLOAT         NOT NULL,
    status          site_status   NOT NULL DEFAULT 'healthy',
    asset_count     INTEGER       NOT NULL DEFAULT 0,
    critical_alerts INTEGER       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refineries_country ON refiner_ai_refineries(country);
CREATE INDEX idx_refineries_status  ON refiner_ai_refineries(status);

-- ── Equipment ─────────────────────────────────────────────────────────────────
CREATE TABLE refiner_ai_equipment (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag             VARCHAR(50)   NOT NULL UNIQUE,
    name            VARCHAR(255)  NOT NULL,
    manufacturer    VARCHAR(255)  NOT NULL,
    model           VARCHAR(255)  NOT NULL,
    site_id         UUID          NOT NULL REFERENCES refiner_ai_refineries(id),
    health_score    FLOAT         NOT NULL DEFAULT 100.0,
    rul_hours       INTEGER,
    ai_status       ai_status     NOT NULL DEFAULT 'HEALTHY',
    action          action_type   NOT NULL DEFAULT 'Monitor',
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_tag      ON refiner_ai_equipment(tag);
CREATE INDEX idx_equipment_site     ON refiner_ai_equipment(site_id);
CREATE INDEX idx_equipment_status   ON refiner_ai_equipment(ai_status);

-- ── Alerts ────────────────────────────────────────────────────────────────────
CREATE TABLE refiner_ai_alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity        alert_severity NOT NULL,
    title           VARCHAR(500)   NOT NULL,
    equipment_id    UUID           NOT NULL REFERENCES refiner_ai_equipment(id),
    details         TEXT,
    rul_hours       FLOAT,
    confidence      FLOAT          NOT NULL,
    model_used      VARCHAR(100),
    is_resolved     BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_alerts_severity    ON refiner_ai_alerts(severity);
CREATE INDEX idx_alerts_equipment   ON refiner_ai_alerts(equipment_id);
CREATE INDEX idx_alerts_created     ON refiner_ai_alerts(created_at DESC);
CREATE INDEX idx_alerts_unresolved  ON refiner_ai_alerts(is_resolved) WHERE is_resolved = FALSE;

-- ── Sensor Readings ───────────────────────────────────────────────────────────
CREATE TABLE refiner_ai_sensor_readings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id    UUID         NOT NULL REFERENCES refiner_ai_equipment(id),
    parameter       VARCHAR(100) NOT NULL,
    value           FLOAT        NOT NULL,
    unit            VARCHAR(30)  NOT NULL,
    timestamp       TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_sensor_equipment   ON refiner_ai_sensor_readings(equipment_id);
CREATE INDEX idx_sensor_parameter   ON refiner_ai_sensor_readings(parameter);
CREATE INDEX idx_sensor_timestamp   ON refiner_ai_sensor_readings(timestamp DESC);

-- ── ML Models ─────────────────────────────────────────────────────────────────
CREATE TABLE refiner_ai_ml_models (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(255) NOT NULL,
    model_type        VARCHAR(100) NOT NULL,
    accuracy          FLOAT        NOT NULL,
    precision         FLOAT,
    recall            FLOAT,
    f1_score          FLOAT,
    assets_monitored  INTEGER      NOT NULL DEFAULT 0,
    status            model_status NOT NULL DEFAULT 'active',
    last_trained      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Spare Parts ───────────────────────────────────────────────────────────────
CREATE TABLE refiner_ai_spare_parts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_number      VARCHAR(100)  NOT NULL UNIQUE,
    name             VARCHAR(500)  NOT NULL,
    category         VARCHAR(100)  NOT NULL,
    stock_level      INTEGER       NOT NULL DEFAULT 0,
    min_stock_level  INTEGER       NOT NULL DEFAULT 1,
    stock_status     stock_status  NOT NULL DEFAULT 'in-stock',
    lead_time_days   INTEGER       NOT NULL DEFAULT 7,
    unit_cost        FLOAT         NOT NULL,
    location         VARCHAR(255),
    last_ordered     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_spare_parts_category ON refiner_ai_spare_parts(category);
CREATE INDEX idx_spare_parts_status   ON refiner_ai_spare_parts(stock_status);

-- ── Work Orders ───────────────────────────────────────────────────────────────
CREATE TABLE refiner_ai_work_orders (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(500)  NOT NULL,
    equipment_id     UUID          NOT NULL REFERENCES refiner_ai_equipment(id),
    priority         wo_priority   NOT NULL,
    status           wo_status     NOT NULL DEFAULT 'open',
    assigned_to      VARCHAR(255),
    estimated_hours  INTEGER,
    ai_generated     BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    due_date         TIMESTAMPTZ
);

CREATE INDEX idx_wo_equipment ON refiner_ai_work_orders(equipment_id);
CREATE INDEX idx_wo_priority  ON refiner_ai_work_orders(priority);
CREATE INDEX idx_wo_status    ON refiner_ai_work_orders(status);
