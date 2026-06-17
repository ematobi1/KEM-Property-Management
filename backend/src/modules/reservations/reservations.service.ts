import { AllocationType, Prisma, ReservationStatus } from '@prisma/client';
import { prisma } from '../../db/client';
import { pii } from '../../shared/utils/pii';
import { paginate, paginationArgs } from '../../shared/utils/pagination';
import { NotFoundError, BadRequestError } from '../../shared/errors/AppError';
import { assertTenantOwnership } from '../../middleware/tenantGuard';
import { CreateReservationInput, UpdateReservationInput, ReservationSearchInput } from './reservations.schema';
import { nanoid } from '../../shared/utils/nanoid';

function buildSearchFilter(propertyId: string, input: ReservationSearchInput): Prisma.ReservationWhereInput {
  const base: Prisma.ReservationWhereInput = { propertyId };

  if (input.status) base.status = input.status;
  if (input.loyaltyTier) base.loyaltyTier = input.loyaltyTier;

  // Search by confirmationNumber or roomNumber only — guest name search requires
  // decrypting all records which is intentionally avoided at scale.
  // For name search, a deterministic HMAC index would be the production approach.
  if (input.query) {
    base.OR = [
      { confirmationNumber: { contains: input.query, mode: 'insensitive' } },
      { roomNumber: { equals: input.query } },
    ];
  }

  return base;
}

function decryptReservation(r: {
  id: string;
  confirmationNumber: string;
  propertyId: string;
  roomNumber: string | null;
  guestFirstName: string;
  guestLastName: string;
  loyaltyTier: string;
  earlyCheckInEligible: boolean;
  lateCheckOutEligible: boolean;
  depositStatus: string;
  status: string;
  checkInDate: Date;
  checkOutDate: Date;
  createdAt: Date;
  updatedAt: Date;
}, privileged = false) {
  const { firstName, lastName } = privileged
    ? pii.decryptName(r.guestFirstName, r.guestLastName)
    : pii.maskName(r.guestFirstName, r.guestLastName);

  return { ...r, guestFirstName: firstName, guestLastName: lastName };
}

export async function searchReservations(propertyId: string, input: ReservationSearchInput, privileged = false) {
  const where = buildSearchFilter(propertyId, input);
  const { skip, take } = paginationArgs(input.page, input.limit);

  const [rows, total] = await prisma.$transaction([
    prisma.reservation.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.reservation.count({ where }),
  ]);

  return paginate(rows.map((r) => decryptReservation(r, privileged)), total, input.page, input.limit);
}

export async function getReservationById(propertyId: string, id: string, privileged = false) {
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) throw new NotFoundError('Reservation');
  assertTenantOwnership(propertyId, reservation.propertyId);
  return decryptReservation(reservation, privileged);
}

export async function createReservation(propertyId: string, input: CreateReservationInput) {
  const confirmationNumber = `${await getPropertyCode(propertyId)}-${nanoid(8).toUpperCase()}`;

  if (input.roomNumber) {
    const roomExists = await prisma.room.findUnique({
      where: { roomNumber_propertyId: { roomNumber: input.roomNumber, propertyId } },
    });
    if (!roomExists) throw new NotFoundError('Room');
  }

  const reservation = await prisma.reservation.create({
    data: {
      confirmationNumber,
      propertyId,
      roomNumber: input.roomNumber,
      guestFirstName: pii.encrypt(input.guestFirstName),
      guestLastName: pii.encrypt(input.guestLastName),
      loyaltyTier: input.loyaltyTier,
      earlyCheckInEligible: input.earlyCheckInEligible,
      lateCheckOutEligible: input.lateCheckOutEligible,
      depositStatus: input.depositStatus,
      status: ReservationStatus.Arrival,
      checkInDate: new Date(input.checkInDate),
      checkOutDate: new Date(input.checkOutDate),
    },
  });

  return decryptReservation(reservation, true);
}

export async function updateReservation(propertyId: string, id: string, input: UpdateReservationInput) {
  const existing = await prisma.reservation.findUnique({ where: { id }, select: { propertyId: true } });
  if (!existing) throw new NotFoundError('Reservation');
  assertTenantOwnership(propertyId, existing.propertyId);

  const data: Prisma.ReservationUpdateInput = { ...input };
  if (input.guestFirstName) data.guestFirstName = pii.encrypt(input.guestFirstName);
  if (input.guestLastName) data.guestLastName = pii.encrypt(input.guestLastName);
  if (input.checkInDate) data.checkInDate = new Date(input.checkInDate);
  if (input.checkOutDate) data.checkOutDate = new Date(input.checkOutDate);

  const updated = await prisma.reservation.update({ where: { id }, data });
  return decryptReservation(updated, true);
}

export async function confirmAllocation(
  propertyId: string,
  reservationId: string,
  allocationLogId: string,
  userId: string,
) {
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation) throw new NotFoundError('Reservation');
  assertTenantOwnership(propertyId, reservation.propertyId);

  if (reservation.status !== ReservationStatus.Arrival) {
    throw new BadRequestError('Allocation can only be confirmed for Arrival status reservations');
  }

  const log = await prisma.roomAllocationLog.findUnique({ where: { id: allocationLogId } });
  if (!log) throw new NotFoundError('AllocationLog');
  assertTenantOwnership(propertyId, log.propertyId);

  if (log.reservationId !== reservationId) {
    throw new BadRequestError('Allocation log does not belong to this reservation');
  }
  if (log.allocationType !== AllocationType.SOFT_ALLOCATION) {
    throw new BadRequestError('Only SOFT_ALLOCATION logs can be confirmed');
  }

  const [updatedReservation] = await prisma.$transaction([
    prisma.reservation.update({
      where: { id: reservationId },
      data: { roomNumber: log.roomNumber },
    }),
    prisma.roomAllocationLog.create({
      data: {
        propertyId,
        reservationId,
        roomNumber: log.roomNumber,
        allocationType: AllocationType.AUTO_ASSIGNED,
        reason: `Confirmed from soft allocation ${allocationLogId}`,
        allocatedBy: userId,
      },
    }),
  ]);

  return decryptReservation(updatedReservation, true);
}

export async function overrideAllocation(
  propertyId: string,
  reservationId: string,
  newRoomNumber: string,
  userId: string,
) {
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation) throw new NotFoundError('Reservation');
  assertTenantOwnership(propertyId, reservation.propertyId);

  const room = await prisma.room.findUnique({
    where: { roomNumber_propertyId: { roomNumber: newRoomNumber, propertyId } },
  });
  if (!room) throw new NotFoundError('Room');

  const [updatedReservation] = await prisma.$transaction([
    prisma.reservation.update({
      where: { id: reservationId },
      data: { roomNumber: newRoomNumber },
    }),
    prisma.roomAllocationLog.create({
      data: {
        propertyId,
        reservationId,
        roomNumber: newRoomNumber,
        allocationType: AllocationType.MANUAL_OVERRIDE,
        reason: `Manual room override to ${newRoomNumber}`,
        allocatedBy: userId,
      },
    }),
  ]);

  return decryptReservation(updatedReservation, true);
}

async function getPropertyCode(propertyId: string): Promise<string> {
  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { code: true } });
  return property?.code ?? 'UNK';
}
