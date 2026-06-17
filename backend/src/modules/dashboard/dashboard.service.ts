import {
  AvailabilityStatus,
  DepositStatus,
  HousekeepingStatus,
  LedgerLineType,
  OccupancyStatus,
  ReservationStatus,
} from '@prisma/client';
import { prisma } from '../../db/client';

// ─── Direct-query metrics (always available, no materialized views required) ──

export async function getDashboardMetrics(propertyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    inHouseCount,
    departuresCount,
    dirtyRoomsCount,
    readyRoomsCount,
    arrivalsCount,
    noShowCount,
    advanceDepositsPaidCount,
    bookedTodayCount,
    totalRoomsCount,
    outOfOrderCount,
    soldCount,
    availableCount,
  ] = await Promise.all([
    prisma.reservation.count({ where: { propertyId, status: ReservationStatus.InHouse } }),
    prisma.reservation.count({ where: { propertyId, status: ReservationStatus.Departure } }),
    prisma.room.count({ where: { propertyId, housekeepingStatus: HousekeepingStatus.Dirty } }),
    prisma.room.count({ where: { propertyId, housekeepingStatus: HousekeepingStatus.Ready } }),
    prisma.reservation.count({
      where: { propertyId, status: ReservationStatus.Arrival, checkInDate: { gte: today, lt: tomorrow } },
    }),
    prisma.reservation.count({ where: { propertyId, status: ReservationStatus.NoShow } }),
    prisma.reservation.count({ where: { propertyId, depositStatus: DepositStatus.Paid } }),
    prisma.reservation.count({ where: { propertyId, createdAt: { gte: today, lt: tomorrow } } }),
    prisma.room.count({ where: { propertyId } }),
    prisma.room.count({ where: { propertyId, availabilityStatus: AvailabilityStatus.OutOfOrder } }),
    prisma.room.count({ where: { propertyId, availabilityStatus: AvailabilityStatus.Sold } }),
    prisma.room.count({ where: { propertyId, availabilityStatus: AvailabilityStatus.Available } }),
  ]);

  return {
    house: {
      inHouse: inHouseCount,
      departures: departuresCount,
      dirtyRooms: dirtyRoomsCount,
      readyRooms: readyRoomsCount,
    },
    bookings: {
      arrivals: arrivalsCount,
      noShowOrLateCancel: noShowCount,
      advanceDepositsPaid: advanceDepositsPaidCount,
      bookedToday: bookedTodayCount,
    },
    availability: {
      totalRooms: totalRoomsCount,
      outOfOrder: outOfOrderCount,
      sold: soldCount,
      available: availableCount,
    },
  };
}

// ─── Materialized-view metrics (requires migration 0004 to have run) ──────────

type MvDailyRow = {
  property_id: string;
  metric_date: Date;
  rooms_occupied: unknown;
  total_rooms: unknown;
  rooms_out_of_order: unknown;
  rooms_sold: unknown;
  rooms_available: unknown;
  rooms_dirty: unknown;
  rooms_clean: unknown;
  rooms_ready: unknown;
  guests_in_house: unknown;
  departures_pending: unknown;
  arrivals_expected: unknown;
  no_shows: unknown;
  total_revenue_cents: unknown;
  deposits_paid: unknown;
  deposits_pending: unknown;
};

type MvKpiRow = {
  property_id: string;
  adr_cents: unknown;
  revpar_cents: unknown;
  occupancy_percent: unknown;
};

function n(v: unknown): number {
  return parseFloat(String(v));
}

export async function getDashboardMetricsFromViews(propertyId: string) {
  const [metricsRows, kpiRows] = await Promise.all([
    prisma.$queryRaw<MvDailyRow[]>`
      SELECT * FROM mv_property_daily_metrics WHERE property_id = ${propertyId}::uuid
    `,
    prisma.$queryRaw<MvKpiRow[]>`
      SELECT * FROM mv_property_kpis WHERE property_id = ${propertyId}::uuid
    `,
  ]);

  const m = metricsRows[0];
  const k = kpiRows[0];

  if (!m) return null;

  return {
    house: {
      inHouse: n(m.guests_in_house),
      departuresPending: n(m.departures_pending),
      roomsDirty: n(m.rooms_dirty),
      roomsClean: n(m.rooms_clean),
      roomsReady: n(m.rooms_ready),
    },
    bookings: {
      arrivalsExpected: n(m.arrivals_expected),
      noShows: n(m.no_shows),
      depositsPaid: n(m.deposits_paid),
      depositsPending: n(m.deposits_pending),
    },
    availability: {
      totalRooms: n(m.total_rooms),
      outOfOrder: n(m.rooms_out_of_order),
      sold: n(m.rooms_sold),
      available: n(m.rooms_available),
    },
    kpis: {
      adrCents: k ? n(k.adr_cents) : 0,
      revparCents: k ? n(k.revpar_cents) : 0,
      occupancyPercent: k ? n(k.occupancy_percent) : 0,
    },
    lastRefreshed: m.metric_date,
  };
}

// ─── Month-over-month comparison ──────────────────────────────────────────────

export async function getMonthOverMonthComparison(propertyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [current, previous] = await Promise.all([
    getDashboardMetrics(propertyId),
    prisma.propertyDailySnapshot.findUnique({
      where: { propertyId_snapshotDate: { propertyId, snapshotDate: thirtyDaysAgo } },
    }),
  ]);

  return {
    currentDate: today.toISOString().split('T')[0],
    previousDate: thirtyDaysAgo.toISOString().split('T')[0],
    current,
    previous: previous
      ? {
          house: {
            inHouse: previous.guestsInHouse,
            departures: previous.departuresPending,
            dirtyRooms: 0,
            readyRooms: 0,
          },
          bookings: {
            arrivals: previous.arrivalsExpected,
            noShowOrLateCancel: previous.noShows,
            advanceDepositsPaid: previous.depositsPaid,
            bookedToday: 0,
          },
          availability: {
            totalRooms: previous.totalRooms,
            outOfOrder: previous.roomsOutOfOrder,
            sold: previous.roomsSold,
            available: previous.totalRooms - previous.roomsOutOfOrder - previous.roomsSold,
          },
          kpis: {
            adrCents: previous.adrCents,
            revparCents: previous.revparCents,
            occupancyPercent: previous.occupancyPercent,
          },
        }
      : null,
    snapshotAvailable: previous !== null,
  };
}

// ─── Nightly snapshot (called via OnNightAudit handler) ───────────────────────

export async function takeNightlySnapshot(propertyId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalRooms,
    roomsOccupied,
    roomsOutOfOrder,
    roomsSold,
    guestsInHouse,
    departuresPending,
    arrivalsExpected,
    noShows,
    depositsPaid,
    depositsPending,
    revenueResult,
  ] = await Promise.all([
    prisma.room.count({ where: { propertyId } }),
    prisma.room.count({ where: { propertyId, occupancyStatus: OccupancyStatus.Occupied } }),
    prisma.room.count({ where: { propertyId, availabilityStatus: AvailabilityStatus.OutOfOrder } }),
    prisma.room.count({ where: { propertyId, availabilityStatus: AvailabilityStatus.Sold } }),
    prisma.reservation.count({ where: { propertyId, status: ReservationStatus.InHouse } }),
    prisma.reservation.count({ where: { propertyId, status: ReservationStatus.Departure } }),
    prisma.reservation.count({
      where: { propertyId, status: ReservationStatus.Arrival, checkInDate: { gte: today, lt: tomorrow } },
    }),
    prisma.reservation.count({ where: { propertyId, status: ReservationStatus.NoShow } }),
    prisma.reservation.count({ where: { propertyId, depositStatus: DepositStatus.Paid } }),
    prisma.reservation.count({ where: { propertyId, depositStatus: DepositStatus.Pending } }),
    prisma.financialLedgerLine.aggregate({
      where: { propertyId, lineType: LedgerLineType.CHARGE, createdAt: { gte: today, lt: tomorrow } },
      _sum: { amountCents: true },
    }),
  ]);

  const totalRevenueCents = revenueResult._sum.amountCents ?? 0;
  const availableRooms = totalRooms - roomsOutOfOrder;
  const occupancyPercent = totalRooms > 0 ? (roomsOccupied / totalRooms) * 100 : 0;
  const adrCents = roomsSold > 0 ? Math.floor(totalRevenueCents / roomsSold) : 0;
  const revparCents = availableRooms > 0 ? Math.floor(totalRevenueCents / availableRooms) : 0;

  await prisma.propertyDailySnapshot.upsert({
    where: { propertyId_snapshotDate: { propertyId, snapshotDate: today } },
    create: {
      propertyId,
      snapshotDate: today,
      totalRooms,
      roomsOccupied,
      roomsOutOfOrder,
      roomsSold,
      guestsInHouse,
      departuresPending,
      arrivalsExpected,
      noShows,
      totalRevenueCents,
      depositsPaid,
      depositsPending,
      occupancyPercent,
      adrCents,
      revparCents,
    },
    update: {
      totalRooms,
      roomsOccupied,
      roomsOutOfOrder,
      roomsSold,
      guestsInHouse,
      departuresPending,
      arrivalsExpected,
      noShows,
      totalRevenueCents,
      depositsPaid,
      depositsPending,
      occupancyPercent,
      adrCents,
      revparCents,
    },
  });
}
