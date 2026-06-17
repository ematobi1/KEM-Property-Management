import { AllocationType, HousekeepingStatus, LoyaltyTier, ReservationStatus } from '@prisma/client';
import { prisma } from '../../../db/client';

const LOYALTY_SCORES: Record<LoyaltyTier, number> = {
  [LoyaltyTier.Diamond]: 60,
  [LoyaltyTier.Platinum]: 50,
  [LoyaltyTier.Gold]: 40,
  [LoyaltyTier.Silver]: 30,
  [LoyaltyTier.Club]: 20,
  [LoyaltyTier.None]: 0,
};

function scoreCandidate(r: { loyaltyTier: LoyaltyTier; earlyCheckInEligible: boolean }): number {
  return LOYALTY_SCORES[r.loyaltyTier] + (r.earlyCheckInEligible ? 10 : 0);
}

export async function handleRoomStatusChange(
  propertyId: string,
  roomNumber: string,
  toStatus: HousekeepingStatus,
): Promise<void> {
  if (toStatus !== HousekeepingStatus.Ready) return;

  const candidates = await prisma.reservation.findMany({
    where: {
      propertyId,
      status: ReservationStatus.Arrival,
      roomNumber: null,
    },
    select: {
      id: true,
      loyaltyTier: true,
      earlyCheckInEligible: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (candidates.length === 0) return;

  const top = candidates.reduce((best, cur) =>
    scoreCandidate(cur) > scoreCandidate(best) ? cur : best,
  );

  await prisma.roomAllocationLog.create({
    data: {
      propertyId,
      reservationId: top.id,
      roomNumber,
      allocationType: AllocationType.SOFT_ALLOCATION,
      reason: `Auto-scored: loyaltyTier=${top.loyaltyTier}, earlyCheckIn=${top.earlyCheckInEligible}`,
      allocatedBy: 'system',
    },
  });
}
