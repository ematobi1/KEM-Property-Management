import { ReservationStatus, HousekeepingStatus, OccupancyStatus, AvailabilityStatus } from '@prisma/client';
import { prisma } from '../../db/client';
import { pii } from '../../shared/utils/pii';
import { paginate, paginationArgs } from '../../shared/utils/pagination';
import { NotFoundError, BadRequestError } from '../../shared/errors/AppError';
import { assertTenantOwnership } from '../../middleware/tenantGuard';
import { CheckInInput } from './arrivals.schema';

export async function listArrivals(propertyId: string, page: number, limit: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const where = {
    propertyId,
    status: ReservationStatus.Arrival,
    checkInDate: { gte: today, lt: tomorrow },
  };

  const { skip, take } = paginationArgs(page, limit);
  const [rows, total] = await prisma.$transaction([
    prisma.reservation.findMany({
      where,
      skip,
      take,
      orderBy: { checkInDate: 'asc' },
      include: { room: { select: { roomNumber: true, roomType: true, housekeepingStatus: true } } },
    }),
    prisma.reservation.count({ where }),
  ]);

  const data = rows.map((r) => {
    const { firstName, lastName } = pii.maskName(r.guestFirstName, r.guestLastName);
    return { ...r, guestFirstName: firstName, guestLastName: lastName };
  });

  return paginate(data, total, page, limit);
}

export async function checkIn(propertyId: string, reservationId: string, input: CheckInInput) {
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation) throw new NotFoundError('Reservation');
  assertTenantOwnership(propertyId, reservation.propertyId);

  if (reservation.status !== ReservationStatus.Arrival) {
    throw new BadRequestError(`Cannot check in a reservation with status '${reservation.status}'`);
  }

  const room = await prisma.room.findUnique({
    where: { roomNumber_propertyId: { roomNumber: input.roomNumber, propertyId } },
  });
  if (!room) throw new NotFoundError('Room');

  if (room.availabilityStatus !== AvailabilityStatus.Available) {
    throw new BadRequestError(`Room ${input.roomNumber} is not available (status: ${room.availabilityStatus})`);
  }

  if (room.housekeepingStatus !== HousekeepingStatus.Ready && !reservation.earlyCheckInEligible) {
    throw new BadRequestError(
      `Room ${input.roomNumber} is not ready. Early check-in is not authorized for this reservation.`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id: reservationId },
      data: { status: ReservationStatus.InHouse, roomNumber: input.roomNumber },
    });

    await tx.room.update({
      where: { roomNumber_propertyId: { roomNumber: input.roomNumber, propertyId } },
      data: {
        occupancyStatus: OccupancyStatus.Occupied,
        availabilityStatus: AvailabilityStatus.Sold,
      },
    });
  });

  return { message: 'Check-in complete', reservationId, roomNumber: input.roomNumber };
}

export async function autoAssignRooms(propertyId: string, reservationIds: string[]) {
  const reservations = await prisma.reservation.findMany({
    where: { id: { in: reservationIds }, propertyId, status: ReservationStatus.Arrival, roomNumber: null },
  });

  if (reservations.length === 0) {
    throw new BadRequestError('No eligible unassigned Arrival reservations found in the provided list');
  }

  const availableRooms = await prisma.room.findMany({
    where: {
      propertyId,
      availabilityStatus: AvailabilityStatus.Available,
      housekeepingStatus: HousekeepingStatus.Ready,
    },
    take: reservations.length,
  });

  const assignments: { reservationId: string; roomNumber: string }[] = [];
  const unassigned: string[] = [];

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < reservations.length; i++) {
      const res = reservations[i];
      const room = availableRooms[i];
      if (!res || !room) {
        if (res) unassigned.push(res.id);
        continue;
      }

      await tx.reservation.update({
        where: { id: res.id },
        data: { roomNumber: room.roomNumber },
      });

      await tx.room.update({
        where: { roomNumber_propertyId: { roomNumber: room.roomNumber, propertyId } },
        data: { availabilityStatus: AvailabilityStatus.Sold },
      });

      assignments.push({ reservationId: res.id, roomNumber: room.roomNumber });
    }
  });

  return { assigned: assignments, unassigned };
}

export async function printRegistrationCards(propertyId: string, reservationIds: string[]) {
  const reservations = await prisma.reservation.findMany({
    where: { id: { in: reservationIds }, propertyId },
  });

  return reservations.map((r) => {
    const { firstName, lastName } = pii.decryptName(r.guestFirstName, r.guestLastName);
    return {
      confirmationNumber: r.confirmationNumber,
      guestName: `${firstName} ${lastName}`,
      roomNumber: r.roomNumber,
      loyaltyTier: r.loyaltyTier,
      checkInDate: r.checkInDate,
      checkOutDate: r.checkOutDate,
    };
  });
}
