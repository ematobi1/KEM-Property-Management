-- Migration: 0001_initial_schema
-- Creates full PMS schema with all domain tables, enums, indexes, and FK constraints.

-- ─── Extensions ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE "HousekeepingStatus" AS ENUM ('Dirty', 'Clean', 'Ready');
CREATE TYPE "OccupancyStatus"    AS ENUM ('Vacant', 'Occupied');
CREATE TYPE "AvailabilityStatus" AS ENUM ('Available', 'Sold', 'OutOfOrder');
CREATE TYPE "StatusIndicator"    AS ENUM ('DND', 'DenyService', 'StayoverService', 'FullService');
CREATE TYPE "LoyaltyTier"        AS ENUM ('Club', 'Silver', 'Gold', 'Platinum', 'Diamond', 'None');
CREATE TYPE "DepositStatus"      AS ENUM ('Paid', 'Pending', 'Future');
CREATE TYPE "ReservationStatus"  AS ENUM ('InHouse', 'Arrival', 'Departure', 'NoShow', 'Canceled');
CREATE TYPE "UserRole"           AS ENUM ('FrontDeskAgent', 'HousekeepingStaff', 'HousekeepingManager', 'SystemAgent', 'Admin');
CREATE TYPE "AgentStatus"        AS ENUM ('Active', 'Inactive', 'Paused');
CREATE TYPE "HookEvent"          AS ENUM ('OnRoomStatusChange', 'OnCheckIn', 'OnCheckOut', 'OnReservationCreate', 'OnReservationCancel', 'OnNightAudit');
CREATE TYPE "HookMethod"         AS ENUM ('GET', 'POST', 'PUT', 'PATCH');

-- ─── Properties ───────────────────────────────────────────────────────────────

CREATE TABLE properties (
    id         UUID         NOT NULL DEFAULT gen_random_uuid(),
    name       TEXT         NOT NULL,
    code       CHAR(5)      NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_properties PRIMARY KEY (id),
    CONSTRAINT uq_properties_code UNIQUE (code)
);

-- ─── Rooms ────────────────────────────────────────────────────────────────────

CREATE TABLE rooms (
    room_number          TEXT                  NOT NULL,
    property_id          UUID                  NOT NULL,
    room_type            TEXT                  NOT NULL,
    floor                TEXT                  NOT NULL,
    zone                 TEXT,
    building             TEXT,
    housekeeping_status  "HousekeepingStatus"  NOT NULL DEFAULT 'Dirty',
    occupancy_status     "OccupancyStatus"     NOT NULL DEFAULT 'Vacant',
    availability_status  "AvailabilityStatus"  NOT NULL DEFAULT 'Available',
    status_indicators    "StatusIndicator"[]   NOT NULL DEFAULT '{}',
    created_at           TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_rooms PRIMARY KEY (room_number, property_id),
    CONSTRAINT fk_rooms_property FOREIGN KEY (property_id)
        REFERENCES properties (id) ON DELETE CASCADE
);

CREATE INDEX idx_rooms_property_hk_status   ON rooms (property_id, housekeeping_status);
CREATE INDEX idx_rooms_property_avail_status ON rooms (property_id, availability_status);

-- ─── Users ────────────────────────────────────────────────────────────────────

CREATE TABLE users (
    id            UUID        NOT NULL DEFAULT gen_random_uuid(),
    property_id   UUID        NOT NULL,
    email         TEXT        NOT NULL,
    first_name    TEXT        NOT NULL,
    last_name     TEXT        NOT NULL,
    initials      CHAR(2)     NOT NULL,
    role          "UserRole"  NOT NULL,
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email_property UNIQUE (email, property_id),
    CONSTRAINT fk_users_property FOREIGN KEY (property_id)
        REFERENCES properties (id) ON DELETE CASCADE
);

-- ─── Reservations ─────────────────────────────────────────────────────────────

CREATE TABLE reservations (
    id                     UUID                 NOT NULL DEFAULT gen_random_uuid(),
    confirmation_number    TEXT                 NOT NULL,
    property_id            UUID                 NOT NULL,
    room_number            TEXT,
    -- Guest PII stored AES-256-GCM encrypted by the application layer.
    -- Format: iv_hex:auth_tag_hex:ciphertext_hex
    guest_first_name       TEXT                 NOT NULL,
    guest_last_name        TEXT                 NOT NULL,
    loyalty_tier           "LoyaltyTier"        NOT NULL DEFAULT 'None',
    early_check_in_eligible BOOLEAN             NOT NULL DEFAULT FALSE,
    late_check_out_eligible  BOOLEAN            NOT NULL DEFAULT FALSE,
    deposit_status         "DepositStatus"      NOT NULL DEFAULT 'Pending',
    status                 "ReservationStatus"  NOT NULL DEFAULT 'Arrival',
    check_in_date          DATE                 NOT NULL,
    check_out_date         DATE                 NOT NULL,
    created_at             TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_reservations PRIMARY KEY (id),
    CONSTRAINT uq_reservations_confirmation UNIQUE (confirmation_number),
    CONSTRAINT fk_reservations_property FOREIGN KEY (property_id)
        REFERENCES properties (id) ON DELETE CASCADE,
    CONSTRAINT fk_reservations_room FOREIGN KEY (room_number, property_id)
        REFERENCES rooms (room_number, property_id) ON DELETE SET NULL,
    CONSTRAINT chk_dates CHECK (check_out_date > check_in_date)
);

CREATE INDEX idx_reservations_property_status    ON reservations (property_id, status);
CREATE INDEX idx_reservations_property_checkin   ON reservations (property_id, check_in_date);
CREATE INDEX idx_reservations_property_checkout  ON reservations (property_id, check_out_date);
CREATE INDEX idx_reservations_property_created   ON reservations (property_id, created_at);

-- ─── Agents ───────────────────────────────────────────────────────────────────

CREATE TABLE agents (
    id          UUID           NOT NULL DEFAULT gen_random_uuid(),
    property_id UUID           NOT NULL,
    name        TEXT           NOT NULL,
    description TEXT,
    status      "AgentStatus"  NOT NULL DEFAULT 'Active',
    config      JSONB          NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_agents PRIMARY KEY (id),
    CONSTRAINT uq_agents_name_property UNIQUE (name, property_id),
    CONSTRAINT fk_agents_property FOREIGN KEY (property_id)
        REFERENCES properties (id) ON DELETE CASCADE
);

-- ─── Skills ───────────────────────────────────────────────────────────────────

CREATE TABLE skills (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    property_id UUID        NOT NULL,
    name        TEXT        NOT NULL,
    description TEXT,
    logic       JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_skills PRIMARY KEY (id),
    CONSTRAINT uq_skills_name_property UNIQUE (name, property_id),
    CONSTRAINT fk_skills_property FOREIGN KEY (property_id)
        REFERENCES properties (id) ON DELETE CASCADE
);

-- ─── Agent ↔ Skill join ───────────────────────────────────────────────────────

CREATE TABLE agent_skills (
    agent_id    UUID        NOT NULL,
    skill_id    UUID        NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_agent_skills PRIMARY KEY (agent_id, skill_id),
    CONSTRAINT fk_agent_skills_agent FOREIGN KEY (agent_id)
        REFERENCES agents (id) ON DELETE CASCADE,
    CONSTRAINT fk_agent_skills_skill FOREIGN KEY (skill_id)
        REFERENCES skills (id) ON DELETE CASCADE
);

-- ─── Instructions ─────────────────────────────────────────────────────────────

CREATE TABLE instructions (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    property_id UUID        NOT NULL,
    agent_id    UUID,
    name        TEXT        NOT NULL,
    blueprint   JSONB       NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_instructions PRIMARY KEY (id),
    CONSTRAINT uq_instructions_name_property UNIQUE (name, property_id),
    CONSTRAINT fk_instructions_property FOREIGN KEY (property_id)
        REFERENCES properties (id) ON DELETE CASCADE,
    CONSTRAINT fk_instructions_agent FOREIGN KEY (agent_id)
        REFERENCES agents (id) ON DELETE SET NULL
);

-- ─── Hooks ────────────────────────────────────────────────────────────────────

CREATE TABLE hooks (
    id          UUID          NOT NULL DEFAULT gen_random_uuid(),
    property_id UUID          NOT NULL,
    agent_id    UUID,
    name        TEXT          NOT NULL,
    event       "HookEvent"   NOT NULL,
    url         TEXT          NOT NULL,
    method      "HookMethod"  NOT NULL DEFAULT 'POST',
    headers     JSONB         NOT NULL DEFAULT '{}',
    is_async    BOOLEAN       NOT NULL DEFAULT TRUE,
    is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_hooks PRIMARY KEY (id),
    CONSTRAINT uq_hooks_name_property UNIQUE (name, property_id),
    CONSTRAINT fk_hooks_property FOREIGN KEY (property_id)
        REFERENCES properties (id) ON DELETE CASCADE,
    CONSTRAINT fk_hooks_agent FOREIGN KEY (agent_id)
        REFERENCES agents (id) ON DELETE SET NULL
);

-- ─── updated_at auto-update trigger ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['properties','rooms','users','reservations','agents','skills','instructions','hooks']
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
            t, t
        );
    END LOOP;
END;
$$;
