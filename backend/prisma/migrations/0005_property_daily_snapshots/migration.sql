-- Migration: 0005_property_daily_snapshots
-- Creates the property_daily_snapshots table for month-over-month KPI comparison.
-- Populated nightly via the OnNightAudit hook handler (takeNightlySnapshot).

CREATE TABLE property_daily_snapshots (
    id                  UUID             NOT NULL DEFAULT gen_random_uuid(),
    property_id         UUID             NOT NULL,
    snapshot_date       DATE             NOT NULL,
    rooms_occupied      INTEGER          NOT NULL DEFAULT 0,
    total_rooms         INTEGER          NOT NULL DEFAULT 0,
    rooms_out_of_order  INTEGER          NOT NULL DEFAULT 0,
    rooms_sold          INTEGER          NOT NULL DEFAULT 0,
    guests_in_house     INTEGER          NOT NULL DEFAULT 0,
    departures_pending  INTEGER          NOT NULL DEFAULT 0,
    arrivals_expected   INTEGER          NOT NULL DEFAULT 0,
    no_shows            INTEGER          NOT NULL DEFAULT 0,
    total_revenue_cents INTEGER          NOT NULL DEFAULT 0,
    deposits_paid       INTEGER          NOT NULL DEFAULT 0,
    deposits_pending    INTEGER          NOT NULL DEFAULT 0,
    occupancy_percent   DOUBLE PRECISION NOT NULL DEFAULT 0,
    adr_cents           INTEGER          NOT NULL DEFAULT 0,
    revpar_cents        INTEGER          NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_property_daily_snapshots PRIMARY KEY (id),
    CONSTRAINT uq_property_daily_snapshots UNIQUE (property_id, snapshot_date),
    CONSTRAINT fk_property_daily_snapshots_property
        FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE
);

CREATE INDEX idx_property_daily_snapshots_lookup
    ON property_daily_snapshots (property_id, snapshot_date DESC);
