import { HookEvent, Prisma, ReservationStatus } from '@prisma/client';
import { prisma } from '../../db/client';
import { ConflictError, NotFoundError } from '../../shared/errors/AppError';
import { assertTenantOwnership } from '../../middleware/tenantGuard';
import { dispatchHooks } from '../extensions/hooks/hooks.service';
import { takeNightlySnapshot } from '../dashboard/dashboard.service';
import { CreateRatePlanInput, UpdateRatePlanInput } from './rates.schema';

// ─── Pricing Strategy (pluggable) ─────────────────────────────────────────────

export interface PricingStrategy {
  computeMultiplier(occupancyPercent: number): number;
}

export class LinearDemandCurve implements PricingStrategy {
  computeMultiplier(occupancyPercent: number): number {
    if (occupancyPercent <= 50) return 0.8;
    if (occupancyPercent <= 75) return 1.0;
    if (occupancyPercent <= 90) return 1.3;
    return 1.6;
  }
}

const defaultStrategy = new LinearDemandCurve();

// ─── Day-of-week helpers ──────────────────────────────────────────────────────

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
type DayKey = (typeof DAY_KEYS)[number];
type DayWeights = Record<DayKey, number>;

function getDayKey(date: Date): DayKey {
  return DAY_KEYS[date.getUTCDay()] as DayKey;
}

function getDayWeight(weights: Prisma.JsonValue, day: DayKey): number {
  if (typeof weights !== 'object' || weights === null || Array.isArray(weights)) return 1.0;
  const w = weights as Record<string, unknown>;
  const val = w[day];
  return typeof val === 'number' ? val : 1.0;
}

// ─── Occupancy helpers ────────────────────────────────────────────────────────

async function queryOccupancyPercent(propertyId: string, roomType: string, date: Date): Promise<number> {
  const [totalRooms, bookedRooms] = await Promise.all([
    prisma.room.count({ where: { propertyId, roomType } }),
    prisma.reservation.count({
      where: {
        propertyId,
        status: { in: [ReservationStatus.InHouse, ReservationStatus.Arrival] },
        checkInDate: { lte: date },
        checkOutDate: { gt: date },
        room: { roomType },
      },
    }),
  ]);
  return totalRooms > 0 ? (bookedRooms / totalRooms) * 100 : 0;
}

// ─── Service methods ──────────────────────────────────────────────────────────

export async function createRatePlan(propertyId: string, input: CreateRatePlanInput) {
  const overlap = await prisma.ratePlan.findFirst({
    where: {
      propertyId,
      roomType: input.roomType,
      isActive: true,
      dateStart: { lte: new Date(input.dateEnd) },
      dateEnd: { gte: new Date(input.dateStart) },
    },
  });
  if (overlap) throw new ConflictError('An active rate plan already exists for this room type and date range');

  return prisma.ratePlan.create({
    data: {
      propertyId,
      roomType: input.roomType,
      dateStart: new Date(input.dateStart),
      dateEnd: new Date(input.dateEnd),
      baseRateCents: input.baseRateCents,
      demandMultiplier: input.demandMultiplier,
      seasonalityFactor: input.seasonalityFactor,
      dayOfWeekWeights: input.dayOfWeekWeights as DayWeights,
    },
  });
}

export async function updateRatePlan(propertyId: string, planId: string, input: UpdateRatePlanInput) {
  const plan = await prisma.ratePlan.findUnique({ where: { id: planId } });
  if (!plan) throw new NotFoundError('RatePlan');
  assertTenantOwnership(propertyId, plan.propertyId);

  const data: Prisma.RatePlanUpdateInput = {
    ...(input.roomType !== undefined && { roomType: input.roomType }),
    ...(input.dateStart !== undefined && { dateStart: new Date(input.dateStart) }),
    ...(input.dateEnd !== undefined && { dateEnd: new Date(input.dateEnd) }),
    ...(input.baseRateCents !== undefined && { baseRateCents: input.baseRateCents }),
    ...(input.demandMultiplier !== undefined && { demandMultiplier: input.demandMultiplier }),
    ...(input.seasonalityFactor !== undefined && { seasonalityFactor: input.seasonalityFactor }),
    ...(input.dayOfWeekWeights !== undefined && { dayOfWeekWeights: input.dayOfWeekWeights as DayWeights }),
  };

  return prisma.ratePlan.update({ where: { id: planId }, data });
}

export async function listRatePlans(propertyId: string) {
  return prisma.ratePlan.findMany({
    where: { propertyId, isActive: true },
    orderBy: [{ roomType: 'asc' }, { dateStart: 'asc' }],
  });
}

export async function getBestAvailableRate(propertyId: string, roomType: string, date: string) {
  const dateObj = new Date(date);

  const plan = await prisma.ratePlan.findFirst({
    where: {
      propertyId,
      roomType,
      isActive: true,
      dateStart: { lte: dateObj },
      dateEnd: { gte: dateObj },
    },
  });
  if (!plan) throw new NotFoundError('RatePlan');

  const dayKey = getDayKey(dateObj);
  const dayWeight = getDayWeight(plan.dayOfWeekWeights, dayKey);

  const finalRateCents = Math.round(
    plan.baseRateCents * plan.demandMultiplier * plan.seasonalityFactor * dayWeight,
  );

  return {
    planId: plan.id,
    roomType: plan.roomType,
    date,
    baseRateCents: plan.baseRateCents,
    finalRateCents,
    currency: 'USD',
  };
}

export async function computeDemandMultiplier(
  propertyId: string,
  roomType: string,
  date: Date,
  strategy: PricingStrategy = defaultStrategy,
): Promise<number> {
  const occupancyPercent = await queryOccupancyPercent(propertyId, roomType, date);
  return strategy.computeMultiplier(occupancyPercent);
}

export async function recalculateRatesForProperty(
  propertyId: string,
  strategy: PricingStrategy = defaultStrategy,
): Promise<{ recalculatedPlans: number }> {
  const activePlans = await prisma.ratePlan.findMany({
    where: { propertyId, isActive: true },
  });

  const today = new Date();
  const next14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  const roomTypes = [...new Set(activePlans.map((p) => p.roomType))];

  const multiplierByType = new Map<string, number>();
  for (const roomType of roomTypes) {
    const occupancies = await Promise.all(
      next14Days.map((d) => queryOccupancyPercent(propertyId, roomType, d)),
    );
    const avgOccupancy = occupancies.reduce((sum, o) => sum + o, 0) / occupancies.length;
    multiplierByType.set(roomType, strategy.computeMultiplier(avgOccupancy));
  }

  for (const plan of activePlans) {
    assertTenantOwnership(propertyId, plan.propertyId);
    const newMultiplier = multiplierByType.get(plan.roomType) ?? 1.0;
    await prisma.ratePlan.update({
      where: { id: plan.id },
      data: { demandMultiplier: newMultiplier },
    });
  }

  void dispatchHooks(propertyId, HookEvent.OnNightAudit, {
    recalculatedPlans: activePlans.length,
    timestamp: new Date().toISOString(),
  });

  void takeNightlySnapshot(propertyId).catch(() => {});

  return { recalculatedPlans: activePlans.length };
}
