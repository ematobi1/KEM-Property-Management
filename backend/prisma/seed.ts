import { PrismaClient, UserRole, HousekeepingStatus, OccupancyStatus, AvailabilityStatus, ReservationStatus, LoyaltyTier, DepositStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { pii } from '../src/shared/utils/pii';

const prisma = new PrismaClient();

async function main() {
  const property = await prisma.property.upsert({
    where: { code: 'KEM01' },
    update: {},
    create: {
      name: 'KEM Property Management',
      code: 'KEM01',
    },
  });

  await prisma.user.upsert({
    where: { email_propertyId: { email: 'kate.ngalame@kem.com', propertyId: property.id } },
    update: {},
    create: {
      propertyId: property.id,
      email: 'kate.ngalame@kem.com',
      firstName: 'Ngalame',
      lastName: 'Kate',
      initials: 'GP',
      role: UserRole.FrontDeskAgent,
      passwordHash: await bcrypt.hash('ChangeMe123!', 12),
    },
  });

  const adminHash = await bcrypt.hash('Admin@KEM2024!', 12);
  await prisma.user.upsert({
    where: { email_propertyId: { email: 'admin@kem.com', propertyId: property.id } },
    update: {},
    create: {
      propertyId: property.id,
      email: 'admin@kem.com',
      firstName: 'System',
      lastName: 'Admin',
      initials: 'SA',
      role: UserRole.Admin,
      passwordHash: adminHash,
    },
  });

  const rooms = [
    { roomNumber: '101', roomType: 'Standard', floor: '1', zone: 'A', building: 'Main' },
    { roomNumber: '102', roomType: 'Standard', floor: '1', zone: 'A', building: 'Main' },
    { roomNumber: '201', roomType: 'King',     floor: '2', zone: 'B', building: 'Main' },
    { roomNumber: '202', roomType: 'Suite',    floor: '2', zone: 'B', building: 'Main' },
    { roomNumber: '301', roomType: 'Queen',    floor: '3', zone: 'C', building: 'Main' },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { roomNumber_propertyId: { roomNumber: room.roomNumber, propertyId: property.id } },
      update: {},
      create: { ...room, propertyId: property.id },
    });
  }

  await prisma.reservation.upsert({
    where: { confirmationNumber: 'KEM-001' },
    update: {},
    create: {
      confirmationNumber: 'KEM-001',
      propertyId: property.id,
      roomNumber: '201',
      guestFirstName: pii.encrypt('John'),
      guestLastName: pii.encrypt('Doe'),
      loyaltyTier: LoyaltyTier.Gold,
      earlyCheckInEligible: true,
      lateCheckOutEligible: false,
      depositStatus: DepositStatus.Paid,
      status: ReservationStatus.InHouse,
      checkInDate: new Date('2026-06-16'),
      checkOutDate: new Date('2026-06-18'),
    },
  });

  console.log('Seed complete for property:', property.code);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
