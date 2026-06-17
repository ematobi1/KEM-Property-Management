export type UserRole = 'FrontDeskAgent' | 'HousekeepingStaff' | 'HousekeepingManager' | 'SystemAgent' | 'Admin';
export type LoyaltyTier = 'Club' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'None';
export type ReservationStatus = 'InHouse' | 'Arrival' | 'Departure' | 'NoShow' | 'Canceled';
export type DepositStatus = 'Paid' | 'Pending' | 'Future';
export type HousekeepingStatus = 'Dirty' | 'Clean' | 'Ready';
export type OccupancyStatus = 'Vacant' | 'Occupied';
export type AvailabilityStatus = 'Available' | 'Sold' | 'OutOfOrder';
export type StatusIndicator = 'DND' | 'DenyService' | 'StayoverService' | 'FullService';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
  role: UserRole;
  propertyId: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface DashboardMetrics {
  house: {
    inHouse: number;
    departures: number;
    dirtyRooms: number;
    readyRooms: number;
  };
  bookings: {
    arrivals: number;
    noShowOrLateCancel: number;
    advanceDepositsPaid: number;
    bookedToday: number;
  };
  availability: {
    totalRooms: number;
    outOfOrder: number;
    sold: number;
    available: number;
  };
}

export interface Reservation {
  id: string;
  confirmationNumber: string;
  propertyId: string;
  roomNumber: string | null;
  guestFirstName: string;
  guestLastName: string;
  loyaltyTier: LoyaltyTier;
  earlyCheckInEligible: boolean;
  lateCheckOutEligible: boolean;
  depositStatus: DepositStatus;
  status: ReservationStatus;
  checkInDate: string;
  checkOutDate: string;
}

export interface Room {
  roomNumber: string;
  propertyId: string;
  roomType: string;
  floor: string;
  zone: string | null;
  building: string | null;
  housekeepingStatus: HousekeepingStatus;
  occupancyStatus: OccupancyStatus;
  availabilityStatus: AvailabilityStatus;
  statusIndicators: StatusIndicator[];
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
