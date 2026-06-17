-- Migration: 0002_add_ledger_rates_digitcard_allocation
-- Adds: FinancialLedgerLine, RatePlan, ExchangeRate, RoomAllocationLog
--       New fields on Reservation (digitcard, identity doc)
--       New enums: LedgerLineType, AllocationType

-- ─── New Enums ────────────────────────────────────────────────────────────────

CREATE TYPE "LedgerLineType" AS ENUM ('CHARGE', 'PAYMENT', 'ADJUSTMENT', 'REFUND');
CREATE TYPE "AllocationType" AS ENUM ('AUTO_ASSIGNED', 'MANUAL_OVERRIDE', 'SOFT_ALLOCATION');

-- ─── Alter Reservations ───────────────────────────────────────────────────────
-- All three columns are nullable or have a DEFAULT — no NOT NULL violation risk.

ALTER TABLE reservations
    ADD COLUMN digitcard_token_hash    TEXT,
    ADD COLUMN is_digitcard_checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN identity_doc_sha256     TEXT;

-- ─── Financial Ledger Lines ───────────────────────────────────────────────────
-- Append-only table: no updated_at column.
-- UPDATE and DELETE are blocked by triggers in migration 0003.

CREATE TABLE financial_ledger_lines (
    id              UUID            NOT NULL DEFAULT gen_random_uuid(),
    property_id     UUID            NOT NULL,
    reservation_id  UUID            NOT NULL,
    folio_id        TEXT            NOT NULL,
    line_type       "LedgerLineType" NOT NULL,
    amount_cents    INTEGER         NOT NULL,
    currency        TEXT            NOT NULL DEFAULT 'USD',
    description     TEXT            NOT NULL,
    posted_by_id    UUID            NOT NULL,
    idempotency_key TEXT            NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_financial_ledger_lines PRIMARY KEY (id),
    CONSTRAINT uq_financial_ledger_lines_idempotency UNIQUE (idempotency_key),
    CONSTRAINT fk_financial_ledger_lines_property FOREIGN KEY (property_id)
        REFERENCES properties (id) ON DELETE CASCADE,
    CONSTRAINT fk_financial_ledger_lines_reservation FOREIGN KEY (reservation_id)
        REFERENCES reservations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_financial_ledger_lines_user FOREIGN KEY (posted_by_id)
        REFERENCES users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_ledger_lines_property_reservation ON financial_ledger_lines (property_id, reservation_id);
CREATE INDEX idx_ledger_lines_property_folio        ON financial_ledger_lines (property_id, folio_id);
CREATE INDEX idx_ledger_lines_property_created      ON financial_ledger_lines (property_id, created_at);

-- ─── Rate Plans ───────────────────────────────────────────────────────────────

CREATE TABLE rate_plans (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
    property_id         UUID        NOT NULL,
    room_type           TEXT        NOT NULL,
    date_start          DATE        NOT NULL,
    date_end            DATE        NOT NULL,
    base_rate_cents     INTEGER     NOT NULL,
    demand_multiplier   FLOAT       NOT NULL DEFAULT 1.0,
    seasonality_factor  FLOAT       NOT NULL DEFAULT 1.0,
    day_of_week_weights JSONB       NOT NULL,
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_rate_plans PRIMARY KEY (id),
    CONSTRAINT chk_rate_plans_dates CHECK (date_end > date_start),
    CONSTRAINT chk_rate_plans_base_rate CHECK (base_rate_cents >= 0),
    CONSTRAINT fk_rate_plans_property FOREIGN KEY (property_id)
        REFERENCES properties (id) ON DELETE CASCADE
);

CREATE INDEX idx_rate_plans_property_type_dates ON rate_plans (property_id, room_type, date_start, date_end);
CREATE INDEX idx_rate_plans_property_active      ON rate_plans (property_id, is_active);

CREATE TRIGGER trg_rate_plans_updated_at
    BEFORE UPDATE ON rate_plans
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Exchange Rates ───────────────────────────────────────────────────────────
-- Immutable snapshots — no updated_at. Insert new rows; never mutate existing ones.

CREATE TABLE exchange_rates (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    property_id     UUID        NOT NULL,
    from_currency   TEXT        NOT NULL,
    to_currency     TEXT        NOT NULL,
    rate_basis_pts  INTEGER     NOT NULL,
    effective_date  DATE        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_exchange_rates PRIMARY KEY (id),
    CONSTRAINT uq_exchange_rates_pair_date UNIQUE (property_id, from_currency, to_currency, effective_date),
    CONSTRAINT chk_exchange_rates_basis_pts CHECK (rate_basis_pts > 0),
    CONSTRAINT fk_exchange_rates_property FOREIGN KEY (property_id)
        REFERENCES properties (id) ON DELETE CASCADE
);

CREATE INDEX idx_exchange_rates_property_pair_date ON exchange_rates (property_id, from_currency, to_currency, effective_date);

-- ─── Room Allocation Logs ─────────────────────────────────────────────────────
-- Audit trail — append-only by convention, no updated_at.
-- allocatedBy is a loose string: "SYSTEM" or a user UUID.

CREATE TABLE room_allocation_logs (
    id              UUID              NOT NULL DEFAULT gen_random_uuid(),
    property_id     UUID              NOT NULL,
    reservation_id  UUID              NOT NULL,
    room_number     TEXT              NOT NULL,
    allocation_type "AllocationType"  NOT NULL,
    reason          TEXT              NOT NULL,
    allocated_by    TEXT              NOT NULL,
    created_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_room_allocation_logs PRIMARY KEY (id),
    CONSTRAINT fk_room_allocation_logs_property FOREIGN KEY (property_id)
        REFERENCES properties (id) ON DELETE CASCADE,
    CONSTRAINT fk_room_allocation_logs_reservation FOREIGN KEY (reservation_id)
        REFERENCES reservations (id) ON DELETE CASCADE,
    CONSTRAINT fk_room_allocation_logs_room FOREIGN KEY (room_number, property_id)
        REFERENCES rooms (room_number, property_id) ON DELETE RESTRICT
);

CREATE INDEX idx_room_allocation_logs_property_reservation ON room_allocation_logs (property_id, reservation_id);
CREATE INDEX idx_room_allocation_logs_property_room        ON room_allocation_logs (property_id, room_number);
CREATE INDEX idx_room_allocation_logs_property_created     ON room_allocation_logs (property_id, created_at);
