import type { DashboardMetrics, Reservation, Room } from '@/types';

export const MOCK_METRICS: DashboardMetrics = {
  house: { inHouse: 84, departures: 17, dirtyRooms: 23, readyRooms: 41 },
  bookings: { arrivals: 22, noShowOrLateCancel: 3, advanceDepositsPaid: 18, bookedToday: 9 },
  availability: { totalRooms: 127, outOfOrder: 4, sold: 84, available: 39 },
};

export const MOCK_RESERVATIONS: Reservation[] = [
  { id: '1', confirmationNumber: 'KEM-A1B2C3', propertyId: 'p1', roomNumber: '201', guestFirstName: 'J***n', guestLastName: 'D**', loyaltyTier: 'Gold', earlyCheckInEligible: true, lateCheckOutEligible: false, depositStatus: 'Paid', status: 'InHouse', checkInDate: '2026-06-15', checkOutDate: '2026-06-18' },
  { id: '2', confirmationNumber: 'KEM-D4E5F6', propertyId: 'p1', roomNumber: '305', guestFirstName: 'S***h', guestLastName: 'C*****r', loyaltyTier: 'Platinum', earlyCheckInEligible: false, lateCheckOutEligible: true, depositStatus: 'Paid', status: 'InHouse', checkInDate: '2026-06-14', checkOutDate: '2026-06-17' },
  { id: '3', confirmationNumber: 'KEM-G7H8I9', propertyId: 'p1', roomNumber: '112', guestFirstName: 'M***e', guestLastName: 'J*****n', loyaltyTier: 'Diamond', earlyCheckInEligible: true, lateCheckOutEligible: true, depositStatus: 'Paid', status: 'InHouse', checkInDate: '2026-06-16', checkOutDate: '2026-06-19' },
  { id: '4', confirmationNumber: 'KEM-J1K2L3', propertyId: 'p1', roomNumber: '418', guestFirstName: 'R***t', guestLastName: 'B***n', loyaltyTier: 'Silver', earlyCheckInEligible: false, lateCheckOutEligible: false, depositStatus: 'Pending', status: 'InHouse', checkInDate: '2026-06-15', checkOutDate: '2026-06-17' },
  { id: '5', confirmationNumber: 'KEM-M4N5O6', propertyId: 'p1', roomNumber: '223', guestFirstName: 'L***a', guestLastName: 'W*****n', loyaltyTier: 'None', earlyCheckInEligible: false, lateCheckOutEligible: false, depositStatus: 'Paid', status: 'InHouse', checkInDate: '2026-06-16', checkOutDate: '2026-06-20' },
  { id: '6', confirmationNumber: 'KEM-P7Q8R9', propertyId: 'p1', roomNumber: '321', guestFirstName: 'D***d', guestLastName: 'K***g', loyaltyTier: 'Gold', earlyCheckInEligible: true, lateCheckOutEligible: false, depositStatus: 'Paid', status: 'InHouse', checkInDate: '2026-06-13', checkOutDate: '2026-06-18' },
];

export const MOCK_ARRIVALS: Reservation[] = [
  { id: '7',  confirmationNumber: 'KEM-AR1001', propertyId: 'p1', roomNumber: null,  guestFirstName: 'A***a', guestLastName: 'T*****r', loyaltyTier: 'Platinum', earlyCheckInEligible: true, lateCheckOutEligible: false, depositStatus: 'Paid', status: 'Arrival', checkInDate: '2026-06-16', checkOutDate: '2026-06-19' },
  { id: '8',  confirmationNumber: 'KEM-AR1002', propertyId: 'p1', roomNumber: '104', guestFirstName: 'B***n', guestLastName: 'M***s', loyaltyTier: 'Gold', earlyCheckInEligible: false, lateCheckOutEligible: false, depositStatus: 'Paid', status: 'Arrival', checkInDate: '2026-06-16', checkOutDate: '2026-06-18' },
  { id: '9',  confirmationNumber: 'KEM-AR1003', propertyId: 'p1', roomNumber: null,  guestFirstName: 'C***s', guestLastName: 'E***s', loyaltyTier: 'None', earlyCheckInEligible: false, lateCheckOutEligible: false, depositStatus: 'Pending', status: 'Arrival', checkInDate: '2026-06-16', checkOutDate: '2026-06-17' },
  { id: '10', confirmationNumber: 'KEM-AR1004', propertyId: 'p1', roomNumber: '210', guestFirstName: 'F***a', guestLastName: 'H*****z', loyaltyTier: 'Diamond', earlyCheckInEligible: true, lateCheckOutEligible: true, depositStatus: 'Paid', status: 'Arrival', checkInDate: '2026-06-16', checkOutDate: '2026-06-22' },
  { id: '11', confirmationNumber: 'KEM-AR1005', propertyId: 'p1', roomNumber: null,  guestFirstName: 'G***g', guestLastName: 'P***k', loyaltyTier: 'Club', earlyCheckInEligible: false, lateCheckOutEligible: false, depositStatus: 'Future', status: 'Arrival', checkInDate: '2026-06-16', checkOutDate: '2026-06-18' },
];

export const MOCK_DEPARTURES: Reservation[] = [
  { id: '12', confirmationNumber: 'KEM-DP2001', propertyId: 'p1', roomNumber: '308', guestFirstName: 'H***y', guestLastName: 'C***k', loyaltyTier: 'Gold', earlyCheckInEligible: false, lateCheckOutEligible: true, depositStatus: 'Paid', status: 'Departure', checkInDate: '2026-06-13', checkOutDate: '2026-06-16' },
  { id: '13', confirmationNumber: 'KEM-DP2002', propertyId: 'p1', roomNumber: '115', guestFirstName: 'I***e', guestLastName: 'Y***g', loyaltyTier: 'None', earlyCheckInEligible: false, lateCheckOutEligible: false, depositStatus: 'Paid', status: 'Departure', checkInDate: '2026-06-14', checkOutDate: '2026-06-16' },
  { id: '14', confirmationNumber: 'KEM-DP2003', propertyId: 'p1', roomNumber: '422', guestFirstName: 'J***e', guestLastName: 'L***z', loyaltyTier: 'Platinum', earlyCheckInEligible: false, lateCheckOutEligible: true, depositStatus: 'Paid', status: 'Departure', checkInDate: '2026-06-12', checkOutDate: '2026-06-16' },
  { id: '15', confirmationNumber: 'KEM-DP2004', propertyId: 'p1', roomNumber: '217', guestFirstName: 'K***n', guestLastName: 'A*****s', loyaltyTier: 'Silver', earlyCheckInEligible: false, lateCheckOutEligible: false, depositStatus: 'Paid', status: 'Departure', checkInDate: '2026-06-15', checkOutDate: '2026-06-16' },
];

export const MOCK_ROOMS: Room[] = [
  { roomNumber: '101', propertyId: 'p1', roomType: 'Standard', floor: '1', zone: 'A', building: 'Main', housekeepingStatus: 'Ready',  occupancyStatus: 'Vacant',   availabilityStatus: 'Available', statusIndicators: [] },
  { roomNumber: '102', propertyId: 'p1', roomType: 'Standard', floor: '1', zone: 'A', building: 'Main', housekeepingStatus: 'Dirty',  occupancyStatus: 'Vacant',   availabilityStatus: 'Available', statusIndicators: [] },
  { roomNumber: '103', propertyId: 'p1', roomType: 'Standard', floor: '1', zone: 'A', building: 'Main', housekeepingStatus: 'Clean',  occupancyStatus: 'Vacant',   availabilityStatus: 'Available', statusIndicators: [] },
  { roomNumber: '104', propertyId: 'p1', roomType: 'King',     floor: '1', zone: 'B', building: 'Main', housekeepingStatus: 'Dirty',  occupancyStatus: 'Occupied', availabilityStatus: 'Sold',      statusIndicators: ['DND'] },
  { roomNumber: '105', propertyId: 'p1', roomType: 'Standard', floor: '1', zone: 'A', building: 'Main', housekeepingStatus: 'Ready',  occupancyStatus: 'Occupied', availabilityStatus: 'Sold',      statusIndicators: ['StayoverService'] },
  { roomNumber: '201', propertyId: 'p1', roomType: 'Suite',    floor: '2', zone: 'A', building: 'Main', housekeepingStatus: 'Dirty',  occupancyStatus: 'Occupied', availabilityStatus: 'Sold',      statusIndicators: [] },
  { roomNumber: '202', propertyId: 'p1', roomType: 'King',     floor: '2', zone: 'A', building: 'Main', housekeepingStatus: 'Ready',  occupancyStatus: 'Vacant',   availabilityStatus: 'Available', statusIndicators: [] },
  { roomNumber: '203', propertyId: 'p1', roomType: 'Queen',    floor: '2', zone: 'B', building: 'Main', housekeepingStatus: 'Dirty',  occupancyStatus: 'Occupied', availabilityStatus: 'Sold',      statusIndicators: ['FullService'] },
  { roomNumber: '204', propertyId: 'p1', roomType: 'Standard', floor: '2', zone: 'B', building: 'Main', housekeepingStatus: 'Clean',  occupancyStatus: 'Vacant',   availabilityStatus: 'Available', statusIndicators: [] },
  { roomNumber: '205', propertyId: 'p1', roomType: 'Suite',    floor: '2', zone: 'A', building: 'Main', housekeepingStatus: 'Dirty',  occupancyStatus: 'Vacant',   availabilityStatus: 'Available', statusIndicators: [] },
  { roomNumber: '301', propertyId: 'p1', roomType: 'King',     floor: '3', zone: 'A', building: 'Main', housekeepingStatus: 'Ready',  occupancyStatus: 'Occupied', availabilityStatus: 'Sold',      statusIndicators: [] },
  { roomNumber: '302', propertyId: 'p1', roomType: 'Standard', floor: '3', zone: 'A', building: 'Main', housekeepingStatus: 'Dirty',  occupancyStatus: 'Occupied', availabilityStatus: 'Sold',      statusIndicators: ['DND'] },
  { roomNumber: '303', propertyId: 'p1', roomType: 'Standard', floor: '3', zone: 'B', building: 'Main', housekeepingStatus: 'Clean',  occupancyStatus: 'Vacant',   availabilityStatus: 'Available', statusIndicators: [] },
  { roomNumber: '304', propertyId: 'p1', roomType: 'Queen',    floor: '3', zone: 'B', building: 'Main', housekeepingStatus: 'Dirty',  occupancyStatus: 'Vacant',   availabilityStatus: 'OutOfOrder', statusIndicators: [] },
  { roomNumber: '305', propertyId: 'p1', roomType: 'Suite',    floor: '3', zone: 'A', building: 'Main', housekeepingStatus: 'Dirty',  occupancyStatus: 'Occupied', availabilityStatus: 'Sold',      statusIndicators: [] },
  { roomNumber: '401', propertyId: 'p1', roomType: 'King',     floor: '4', zone: 'A', building: 'Main', housekeepingStatus: 'Ready',  occupancyStatus: 'Vacant',   availabilityStatus: 'Available', statusIndicators: [] },
  { roomNumber: '402', propertyId: 'p1', roomType: 'Standard', floor: '4', zone: 'A', building: 'Main', housekeepingStatus: 'Dirty',  occupancyStatus: 'Occupied', availabilityStatus: 'Sold',      statusIndicators: [] },
  { roomNumber: '403', propertyId: 'p1', roomType: 'Suite',    floor: '4', zone: 'B', building: 'Main', housekeepingStatus: 'Ready',  occupancyStatus: 'Vacant',   availabilityStatus: 'Available', statusIndicators: [] },
  { roomNumber: '404', propertyId: 'p1', roomType: 'Standard', floor: '4', zone: 'B', building: 'Main', housekeepingStatus: 'Clean',  occupancyStatus: 'Vacant',   availabilityStatus: 'Available', statusIndicators: [] },
  { roomNumber: '405', propertyId: 'p1', roomType: 'King',     floor: '4', zone: 'A', building: 'Main', housekeepingStatus: 'Dirty',  occupancyStatus: 'Occupied', availabilityStatus: 'Sold',      statusIndicators: ['DenyService'] },
];
