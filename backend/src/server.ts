import "dotenv/config";
import './config'; // validate env before anything else
import app from './app';
import { config } from './config';
import { prisma } from './db/client';
import { WebSocketServer } from 'ws';
import { attachDashboardWs, startWsPushInterval } from './ws/dashboard.ws';
import { refreshDashboardViews } from './shared/utils/materialized-views';

async function start() {
  await prisma.$connect();
  console.log('Database connection established');

  const server = app.listen(config.PORT, () => {
    console.log(`PMS API running on port ${config.PORT} [${config.NODE_ENV}]`);
  });

  const wss = new WebSocketServer({ server, path: '/ws/dashboard' });
  attachDashboardWs(wss);
  console.log('WebSocket server attached at /ws/dashboard');

  const wsPushInterval = startWsPushInterval();

  const viewRefreshInterval = setInterval(() => {
    void refreshDashboardViews(prisma).catch(() => {});
  }, 15_000);

  const shutdown = async (signal: string) => {
    console.log(`${signal} received — shutting down`);
    clearInterval(wsPushInterval);
    clearInterval(viewRefreshInterval);
    wss.close();
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
