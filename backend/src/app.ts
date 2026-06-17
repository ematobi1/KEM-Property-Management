import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import reservationRoutes from './modules/reservations/reservations.routes';
import housekeepingRoutes from './modules/housekeeping/housekeeping.routes';
import departureRoutes from './modules/departures/departures.routes';
import arrivalRoutes from './modules/arrivals/arrivals.routes';
import agentRoutes from './modules/extensions/agents/agents.routes';
import skillRoutes from './modules/extensions/skills/skills.routes';
import instructionRoutes from './modules/extensions/instructions/instructions.routes';
import hookRoutes from './modules/extensions/hooks/hooks.routes';
import ledgerRoutes from './modules/ledgers/ledgers.routes';
import rateRoutes from './modules/rates/rates.routes';
import digitcardRoutes from './modules/digitcard/digitcard.routes';
import allocationRoutes from './modules/allocations/allocations.routes';

const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? false, credentials: true }));
app.disable('x-powered-by');

// ─── Rate limiting ────────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
  }),
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(compression());

// ─── Health check (unauthenticated) ──────────────────────────────────────────
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// ─── API v1 routes ────────────────────────────────────────────────────────────
const v1 = express.Router();

v1.use('/auth', authRoutes);
v1.use('/dashboard', dashboardRoutes);
v1.use('/reservations', reservationRoutes);
v1.use('/housekeeping', housekeepingRoutes);
v1.use('/departures', departureRoutes);
v1.use('/arrivals', arrivalRoutes);
v1.use('/extensions/agents', agentRoutes);
v1.use('/extensions/skills', skillRoutes);
v1.use('/extensions/instructions', instructionRoutes);
v1.use('/extensions/hooks', hookRoutes);
v1.use('/ledgers', ledgerRoutes);
v1.use('/rates', rateRoutes);
v1.use('/digitcard', digitcardRoutes);
v1.use('/allocations', allocationRoutes);

app.use('/v1', v1);

// ─── 404 fallthrough ──────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
