import { PrismaClient } from '@prisma/client';

export async function refreshDashboardViews(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_property_daily_metrics');
  await prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_property_kpis');
}
