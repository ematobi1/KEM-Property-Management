-- Migration: 0004_dashboard_materialized_views
-- Creates materialized views for KPI dashboard metrics.
-- Enum values match the PascalCase/SCREAMING_SNAKE_CASE conventions defined in 0001_initial_schema.

-- ─── Daily property metrics ───────────────────────────────────────────────────

CREATE MATERIALIZED VIEW mv_property_daily_metrics AS
SELECT
  p.id                                                                               AS property_id,
  CURRENT_DATE                                                                       AS metric_date,

  -- Occupancy
  COUNT(DISTINCT rm.room_number) FILTER (WHERE rm.occupancy_status    = 'Occupied')  AS rooms_occupied,
  COUNT(DISTINCT rm.room_number)                                                      AS total_rooms,
  COUNT(DISTINCT rm.room_number) FILTER (WHERE rm.availability_status = 'OutOfOrder') AS rooms_out_of_order,
  COUNT(DISTINCT rm.room_number) FILTER (WHERE rm.availability_status = 'Sold')       AS rooms_sold,
  COUNT(DISTINCT rm.room_number) FILTER (WHERE rm.availability_status = 'Available')  AS rooms_available,

  -- Housekeeping
  COUNT(DISTINCT rm.room_number) FILTER (WHERE rm.housekeeping_status = 'Dirty')  AS rooms_dirty,
  COUNT(DISTINCT rm.room_number) FILTER (WHERE rm.housekeeping_status = 'Clean')  AS rooms_clean,
  COUNT(DISTINCT rm.room_number) FILTER (WHERE rm.housekeeping_status = 'Ready')  AS rooms_ready,

  -- Reservations
  COUNT(DISTINCT res.id) FILTER (WHERE res.status = 'InHouse')   AS guests_in_house,
  COUNT(DISTINCT res.id) FILTER (WHERE res.status = 'Departure') AS departures_pending,
  COUNT(DISTINCT res.id) FILTER (WHERE res.status = 'Arrival')   AS arrivals_expected,
  COUNT(DISTINCT res.id) FILTER (WHERE res.status = 'NoShow')    AS no_shows,

  -- Financial — today's CHARGE lines only, integer cents
  COALESCE(
    SUM(fll.amount_cents) FILTER (
      WHERE fll.line_type = 'CHARGE'
        AND fll.created_at::date = CURRENT_DATE
    ),
    0
  ) AS total_revenue_cents,

  -- Deposits
  COUNT(DISTINCT res.id) FILTER (WHERE res.deposit_status = 'Paid')    AS deposits_paid,
  COUNT(DISTINCT res.id) FILTER (WHERE res.deposit_status = 'Pending') AS deposits_pending

FROM properties p
LEFT JOIN rooms                  rm  ON rm.property_id  = p.id
LEFT JOIN reservations           res ON res.property_id = p.id
LEFT JOIN financial_ledger_lines fll ON fll.property_id = p.id
GROUP BY p.id;

-- Required for REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX idx_mv_property_daily ON mv_property_daily_metrics (property_id);

-- ─── KPI derived view ─────────────────────────────────────────────────────────

CREATE MATERIALIZED VIEW mv_property_kpis AS
SELECT
  property_id,
  metric_date,
  rooms_occupied,
  total_rooms,
  rooms_sold,
  rooms_out_of_order,

  -- ADR: total room revenue / rooms sold (cents)
  CASE WHEN rooms_sold > 0
    THEN total_revenue_cents / rooms_sold
    ELSE 0
  END AS adr_cents,

  -- RevPAR: total room revenue / available rooms (cents)
  CASE WHEN (total_rooms - rooms_out_of_order) > 0
    THEN total_revenue_cents / (total_rooms - rooms_out_of_order)
    ELSE 0
  END AS revpar_cents,

  -- Occupancy %
  CASE WHEN total_rooms > 0
    THEN ROUND((rooms_occupied::numeric / total_rooms::numeric) * 100, 1)
    ELSE 0::numeric
  END AS occupancy_percent

FROM mv_property_daily_metrics;

CREATE UNIQUE INDEX idx_mv_property_kpis ON mv_property_kpis (property_id);
