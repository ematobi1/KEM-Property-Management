import { apiRequest } from './client';
import type { ApiDashboardMetrics, MoMComparison } from './types';

export function getDashboardMetrics(): Promise<ApiDashboardMetrics> {
  return apiRequest('GET', '/dashboard/metrics');
}

export function getMonthOverMonth(): Promise<MoMComparison> {
  return apiRequest('GET', '/dashboard/mom-comparison');
}

export function triggerRefresh(): Promise<void> {
  return apiRequest('POST', '/dashboard/refresh');
}
