import crypto from 'crypto';
import jwt, { type SignOptions, TokenExpiredError } from 'jsonwebtoken';
import { DepositStatus, ReservationStatus } from '@prisma/client';
import { prisma } from '../../db/client';
import { config } from '../../config';
import { AppError, BadRequestError, ForbiddenError, NotFoundError } from '../../shared/errors/AppError';
import { assertTenantOwnership } from '../../middleware/tenantGuard';
import { PreArrivalCheckInInput, TokenIssueInput } from './digitcard.schema';

interface DigitcardTokenPayload {
  reservationId: string;
  roomNumber: string | null;
  propertyId: string;
}

type TokenVerifyResult =
  | { valid: true; reservationId: string; roomNumber: string; propertyId: string }
  | { valid: false; reason: 'expired' | 'invalid_signature' | 'room_mismatch' | 'reservation_inactive' };

function hashDevice(deviceHardwareId: string): string {
  return crypto.createHash('sha256').update(deviceHardwareId).digest('hex');
}

export async function initiatePreArrivalCheckIn(propertyId: string, data: PreArrivalCheckInInput) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: data.reservationId },
    select: { propertyId: true, status: true, depositStatus: true },
  });
  if (!reservation) throw new NotFoundError('Reservation');
  assertTenantOwnership(propertyId, reservation.propertyId);

  if (reservation.status !== ReservationStatus.Arrival) {
    throw new BadRequestError(
      `Pre-arrival check-in requires Arrival status, current status is '${reservation.status}'`,
    );
  }

  if (reservation.depositStatus !== DepositStatus.Paid) {
    throw new AppError(402, 'DEPOSIT_REQUIRED', 'Advance deposit must be paid before pre-arrival check-in');
  }

  const tokenHash = hashDevice(data.deviceHardwareId);
  const identityDocSha256 = data.identityDocBase64
    ? crypto.createHash('sha256').update(data.identityDocBase64).digest('hex')
    : undefined;

  await prisma.reservation.update({
    where: { id: data.reservationId },
    data: {
      digitcardTokenHash: tokenHash,
      isDigitcardCheckedIn: false,
      ...(identityDocSha256 !== undefined && { identityDocSha256 }),
    },
  });

  return {
    reservationId: data.reservationId,
    status: 'PRE_ARRIVAL_REGISTERED' as const,
    tokenHashPrefix: tokenHash.substring(0, 8),
  };
}

export async function issueAccessToken(propertyId: string, data: TokenIssueInput) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: data.reservationId },
    select: {
      propertyId: true,
      status: true,
      roomNumber: true,
      digitcardTokenHash: true,
    },
  });
  if (!reservation) throw new NotFoundError('Reservation');
  assertTenantOwnership(propertyId, reservation.propertyId);

  if (
    reservation.status !== ReservationStatus.Arrival &&
    reservation.status !== ReservationStatus.InHouse
  ) {
    throw new BadRequestError(
      `Cannot issue token for reservation with status '${reservation.status}'`,
    );
  }

  if (!reservation.roomNumber) {
    throw new BadRequestError('No room assigned to this reservation — cannot issue door token');
  }

  const deviceHash = hashDevice(data.deviceHardwareId);
  if (!reservation.digitcardTokenHash || reservation.digitcardTokenHash !== deviceHash) {
    throw new ForbiddenError('Device hardware ID does not match the registered device for this reservation');
  }

  const payload: DigitcardTokenPayload = {
    reservationId: data.reservationId,
    roomNumber: reservation.roomNumber,
    propertyId,
  };

  const token = jwt.sign(payload, config.DIGITCARD_JWT_SECRET, {
    expiresIn: '15m' as NonNullable<SignOptions['expiresIn']>,
  });

  await prisma.reservation.update({
    where: { id: data.reservationId },
    data: { isDigitcardCheckedIn: true },
  });

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  return {
    token,
    expiresAt: expiresAt.toISOString(),
    roomNumber: reservation.roomNumber,
  };
}

export async function verifyAccessToken(token: string, roomNumber: string): Promise<TokenVerifyResult> {
  let payload: DigitcardTokenPayload;

  try {
    payload = jwt.verify(token, config.DIGITCARD_JWT_SECRET) as DigitcardTokenPayload;
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return { valid: false, reason: 'expired' };
    }
    return { valid: false, reason: 'invalid_signature' };
  }

  if (payload.roomNumber !== roomNumber) {
    return { valid: false, reason: 'room_mismatch' };
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: payload.reservationId },
    select: { status: true, propertyId: true },
  });

  const active =
    reservation?.status === ReservationStatus.Arrival ||
    reservation?.status === ReservationStatus.InHouse;

  if (!reservation || !active) {
    return { valid: false, reason: 'reservation_inactive' };
  }

  return {
    valid: true,
    reservationId: payload.reservationId,
    roomNumber,
    propertyId: reservation.propertyId,
  };
}
