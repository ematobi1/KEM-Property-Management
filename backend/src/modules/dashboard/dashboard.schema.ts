import { z } from 'zod';

export const dashboardMetricsQuerySchema = z.object({
  currency: z.string().length(3).default('USD'),
});

export type DashboardMetricsQuery = z.infer<typeof dashboardMetricsQuerySchema>;
