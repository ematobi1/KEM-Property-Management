import { apiRequest } from './client';
import type { BARResult, CreateRatePlanInput, RatePlan, UpdateRatePlanInput } from './types';

export function createRatePlan(data: CreateRatePlanInput): Promise<RatePlan> {
  return apiRequest('POST', '/rates/plans', data);
}

export function updateRatePlan(planId: string, data: UpdateRatePlanInput): Promise<RatePlan> {
  return apiRequest('PATCH', `/rates/plans/${planId}`, data);
}

export function getRatePlans(): Promise<RatePlan[]> {
  return apiRequest('GET', '/rates/plans');
}

export function getBestAvailableRate(roomType: string, date: string): Promise<BARResult> {
  return apiRequest('GET', '/rates/bar', undefined, { roomType, date });
}

export function triggerRateRecalculation(): Promise<void> {
  return apiRequest('POST', '/rates/recalculate');
}
