import { apiRequest } from './client';
import type { AllocationLog, AllocationReservation, PendingAllocation } from './types';

export function confirmAllocation(
  reservationId: string,
  allocationLogId: string,
): Promise<AllocationReservation> {
  return apiRequest('POST', `/reservations/${reservationId}/confirm-allocation`, {
    allocationLogId,
  });
}

export function overrideAllocation(
  reservationId: string,
  newRoomNumber: string,
): Promise<AllocationReservation> {
  return apiRequest('POST', `/reservations/${reservationId}/override-allocation`, {
    newRoomNumber,
  });
}

export function getPendingAllocations(): Promise<{ data: PendingAllocation[] }> {
  return apiRequest('GET', '/allocations/pending');
}

export function getAllocationLog(
  startDate?: string,
  endDate?: string,
): Promise<{ data: AllocationLog[]; meta: { total: number } }> {
  return apiRequest('GET', '/allocations/log', undefined, { startDate, endDate });
}
