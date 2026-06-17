// ─── Ledgers ──────────────────────────────────────────────────────────────────

export type LedgerLineType = 'CHARGE' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT';

export interface CreateLedgerLineInput {
  reservationId: string;
  folioId: string;
  lineType: LedgerLineType;
  amountCents: number;
  currency: string;
  description: string;
  idempotencyKey: string;
}

export interface LedgerLine {
  id: string;
  propertyId: string;
  reservationId: string;
  folioId: string;
  lineType: LedgerLineType;
  amountCents: number;
  currency: string;
  description: string;
  postedById: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface FolioBalance {
  folioId: string;
  balanceCents: number;
  currency: string;
  lineCount: number;
}

export interface FolioStatement {
  folioId: string;
  lines: LedgerLine[];
  balanceCents: number;
  currency: string;
}

// ─── Rates ────────────────────────────────────────────────────────────────────

export interface DayWeights {
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
}

export interface CreateRatePlanInput {
  roomType: string;
  dateStart: string;
  dateEnd: string;
  baseRateCents: number;
  demandMultiplier: number;
  seasonalityFactor: number;
  dayOfWeekWeights: DayWeights;
}

export type UpdateRatePlanInput = Partial<CreateRatePlanInput>;

export interface RatePlan {
  id: string;
  propertyId: string;
  roomType: string;
  dateStart: string;
  dateEnd: string;
  baseRateCents: number;
  demandMultiplier: number;
  seasonalityFactor: number;
  dayOfWeekWeights: DayWeights;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BARResult {
  planId: string;
  roomType: string;
  date: string;
  baseRateCents: number;
  finalRateCents: number;
  currency: string;
}

// ─── Digitcard ────────────────────────────────────────────────────────────────

export interface PreArrivalInput {
  reservationId: string;
  deviceHardwareId: string;
  identityDocBase64?: string;
}

export interface PreArrivalResult {
  reservationId: string;
  status: 'PRE_ARRIVAL_REGISTERED';
  tokenHashPrefix: string;
}

export interface TokenIssueInput {
  reservationId: string;
  deviceHardwareId: string;
}

export interface TokenResult {
  token: string;
  expiresAt: string;
  roomNumber: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface ApiDashboardMetrics {
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

export interface MoMComparison {
  currentDate: string;
  previousDate: string;
  current: ApiDashboardMetrics;
  previous: (ApiDashboardMetrics & {
    kpis: { adrCents: number; revparCents: number; occupancyPercent: number };
  }) | null;
  snapshotAvailable: boolean;
}

// ─── Allocations ──────────────────────────────────────────────────────────────

export type AllocationType = 'AUTO_ASSIGNED' | 'MANUAL_OVERRIDE' | 'SOFT_ALLOCATION';

export interface AllocationLog {
  id: string;
  propertyId: string;
  reservationId: string;
  roomNumber: string;
  allocationType: AllocationType;
  reason: string;
  allocatedBy: string;
  createdAt: string;
}

export interface PendingAllocation extends AllocationLog {
  reservation: {
    id: string;
    status: string;
    loyaltyTier: string;
    earlyCheckInEligible: boolean;
    roomNumber: string | null;
  };
}

export interface AllocationReservation {
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
  checkInDate: string;
  checkOutDate: string;
}
