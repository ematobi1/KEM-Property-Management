import { HousekeepingStatus, Prisma, StatusIndicator, AvailabilityStatus } from '@prisma/client';
import { prisma } from '../../db/client';
import { paginate, paginationArgs } from '../../shared/utils/pagination';
import { NotFoundError, BadRequestError } from '../../shared/errors/AppError';
import { assertTenantOwnership } from '../../middleware/tenantGuard';
import { RoomFilterInput } from './housekeeping.schema';
import { dispatchHooks } from '../extensions/hooks/hooks.service';
import { handleRoomStatusChange } from '../extensions/handlers/room-allocation.handler';

// Valid state machine transitions: Dirty → Clean → Ready
const VALID_TRANSITIONS: Record<HousekeepingStatus, HousekeepingStatus[]> = {
  [HousekeepingStatus.Dirty]: [HousekeepingStatus.Clean],
  [HousekeepingStatus.Clean]: [HousekeepingStatus.Ready],
  [HousekeepingStatus.Ready]: [HousekeepingStatus.Dirty],
};

async function findRoom(propertyId: string, roomNumber: string) {
  const room = await prisma.room.findUnique({
    where: { roomNumber_propertyId: { roomNumber, propertyId } },
  });
  if (!room) throw new NotFoundError('Room');
  assertTenantOwnership(propertyId, room.propertyId);
  return room;
}

export async function listRooms(propertyId: string, input: RoomFilterInput) {
  const where: Prisma.RoomWhereInput = { propertyId };

  if (input.zone) where.zone = input.zone;
  if (input.floor) where.floor = input.floor;
  if (input.building) where.building = input.building;
  if (input.roomType) where.roomType = input.roomType;
  if (input.housekeepingStatus) where.housekeepingStatus = input.housekeepingStatus;
  if (input.availabilityStatus) where.availabilityStatus = input.availabilityStatus;

  if (input.assigned !== undefined) {
    // "Assigned" means there is an active InHouse or Arrival reservation linked
    where.reservations = input.assigned
      ? { some: { status: { in: ['InHouse', 'Arrival'] } } }
      : { none: { status: { in: ['InHouse', 'Arrival'] } } };
  }

  const { skip, take } = paginationArgs(input.page, input.limit);

  const [rooms, total] = await prisma.$transaction([
    prisma.room.findMany({ where, skip, take, orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }] }),
    prisma.room.count({ where }),
  ]);

  return paginate(rooms, total, input.page, input.limit);
}

export async function transitionRoomStatus(
  propertyId: string,
  roomNumber: string,
  targetStatus: HousekeepingStatus,
) {
  const room = await findRoom(propertyId, roomNumber);

  const allowed = VALID_TRANSITIONS[room.housekeepingStatus];
  if (!allowed.includes(targetStatus)) {
    throw new BadRequestError(
      `Cannot transition room from '${room.housekeepingStatus}' to '${targetStatus}'. ` +
      `Allowed: ${allowed.join(', ')}`,
    );
  }

  const updated = await prisma.room.update({
    where: { roomNumber_propertyId: { roomNumber, propertyId } },
    data: { housekeepingStatus: targetStatus },
  });

  void dispatchHooks(propertyId, 'OnRoomStatusChange', {
    roomNumber,
    fromStatus: room.housekeepingStatus,
    toStatus: targetStatus,
    roomType: updated.roomType,
  });

  void handleRoomStatusChange(propertyId, roomNumber, targetStatus).catch(() => {});

  return updated;
}

export async function setStatusIndicators(
  propertyId: string,
  roomNumber: string,
  indicators: StatusIndicator[],
) {
  await findRoom(propertyId, roomNumber);
  return prisma.room.update({
    where: { roomNumber_propertyId: { roomNumber, propertyId } },
    data: { statusIndicators: indicators },
  });
}

export async function overrideAvailability(
  propertyId: string,
  roomNumber: string,
  availabilityStatus: AvailabilityStatus,
) {
  await findRoom(propertyId, roomNumber);
  return prisma.room.update({
    where: { roomNumber_propertyId: { roomNumber, propertyId } },
    data: { availabilityStatus },
  });
}
