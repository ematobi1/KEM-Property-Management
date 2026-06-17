import { ReservationStatus, HousekeepingStatus, OccupancyStatus, AvailabilityStatus } from '@prisma/client';
import { prisma } from '../../db/client';
import { pii } from '../../shared/utils/pii';
import { paginate, paginationArgs } from '../../shared/utils/pagination';
import { NotFoundError, BadRequestError } from '../../shared/errors/AppError';
import { assertTenantOwnership } from '../../middleware/tenantGuard';

export async function listDepartures(propertyId: string, page: number, limit: number) {
  const where = { propertyId, status: ReservationStatus.Departure };
  const { skip, take } = paginationArgs(page, limit);

  const [rows, total] = await prisma.$transaction([
    prisma.reservation.findMany({
      where,
      skip,
      take,
      orderBy: { checkOutDate: 'asc' },
      include: { room: { select: { roomNumber: true, roomType: true, floor: true } } },
    }),
    prisma.reservation.count({ where }),
  ]);

  const data = rows.map((r) => {
    const { firstName, lastName } = pii.maskName(r.guestFirstName, r.guestLastName);
    return { ...r, guestFirstName: firstName, guestLastName: lastName };
  });

  return paginate(data, total, page, limit);
}

export async function expressCheckOut(propertyId: string, reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: { id: true, propertyId: true, status: true, roomNumber: true, lateCheckOutEligible: true },
  });

  if (!reservation) throw new NotFoundError('Reservation');
  assertTenantOwnership(propertyId, reservation.propertyId);

  if (reservation.status !== ReservationStatus.Departure && reservation.status !== ReservationStatus.InHouse) {
    throw new BadRequestError(
      `Cannot check out a reservation with status '${reservation.status}'`,
    );
  }

  // Atomically: mark reservation checked out, free the room
  await prisma.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id: reservationId },
      data: { status: ReservationStatus.Departure, roomNumber: null },
    });

    if (reservation.roomNumber) {
      await tx.room.update({
        where: { roomNumber_propertyId: { roomNumber: reservation.roomNumber, propertyId } },
        data: {
          housekeepingStatus: HousekeepingStatus.Dirty,
          occupancyStatus: OccupancyStatus.Vacant,
          availabilityStatus: AvailabilityStatus.Available,
          statusIndicators: [],
        },
      });
    }
  });

  return { message: 'Express check-out complete', reservationId };
}

export async function printProformaFolio(propertyId: string, reservationId: string) {
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation) throw new NotFoundError('Reservation');
  assertTenantOwnership(propertyId, reservation.propertyId);

  const { firstName, lastName } = pii.decryptName(reservation.guestFirstName, reservation.guestLastName);

  // In production this would generate a PDF via a print service.
  // The service layer returns the folio payload; the transport layer handles delivery.
  return {
    folio: {
      reservationId: reservation.id,
      confirmationNumber: reservation.confirmationNumber,
      guestName: `${firstName} ${lastName}`,
      roomNumber: reservation.roomNumber,
      checkInDate: reservation.checkInDate,
      checkOutDate: reservation.checkOutDate,
      generatedAt: new Date().toISOString(),
    },
  };
}
