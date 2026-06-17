import { AllocationType } from '@prisma/client';
import { prisma } from '../../db/client';

export async function getAllocationLog(
  propertyId: string,
  startDate?: string,
  endDate?: string,
) {
  return prisma.roomAllocationLog.findMany({
    where: {
      propertyId,
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
}

export async function getPendingAllocations(propertyId: string) {
  return prisma.roomAllocationLog.findMany({
    where: {
      propertyId,
      allocationType: AllocationType.SOFT_ALLOCATION,
      reservation: { roomNumber: null },
    },
    include: {
      reservation: {
        select: {
          id: true,
          status: true,
          loyaltyTier: true,
          earlyCheckInEligible: true,
          roomNumber: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
