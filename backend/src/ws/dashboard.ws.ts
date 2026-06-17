import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthPayload } from '../shared/types';
import { getDashboardMetrics } from '../modules/dashboard/dashboard.service';

const subscriptions = new Map<string, Set<WebSocket>>();

function subscribe(propertyId: string, ws: WebSocket): void {
  const existing = subscriptions.get(propertyId);
  if (existing) {
    existing.add(ws);
  } else {
    subscriptions.set(propertyId, new Set([ws]));
  }
}

function unsubscribe(propertyId: string, ws: WebSocket): void {
  subscriptions.get(propertyId)?.delete(ws);
}

async function pushMetrics(propertyId: string): Promise<void> {
  const sockets = subscriptions.get(propertyId);
  if (!sockets || sockets.size === 0) return;

  try {
    const metrics = await getDashboardMetrics(propertyId);
    const message = JSON.stringify({
      type: 'DASHBOARD_UPDATE',
      data: metrics,
      timestamp: new Date().toISOString(),
    });

    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  } catch {
    // non-fatal: skip this push cycle
  }
}

function extractToken(req: IncomingMessage): string | null {
  const rawUrl = req.url ?? '/';
  const url = new URL(rawUrl, `http://${req.headers.host ?? 'localhost'}`);
  return url.searchParams.get('token');
}

export function attachDashboardWs(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const token = extractToken(req);
    if (!token) {
      ws.close(4001, 'Authentication required');
      return;
    }

    let payload: AuthPayload;
    try {
      payload = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
    } catch {
      ws.close(4001, 'Invalid or expired token');
      return;
    }

    const { propertyId } = payload;
    subscribe(propertyId, ws);

    void pushMetrics(propertyId);

    ws.on('close', () => unsubscribe(propertyId, ws));
    ws.on('error', () => unsubscribe(propertyId, ws));
  });
}

export function startWsPushInterval(): NodeJS.Timeout {
  return setInterval(() => {
    for (const propertyId of subscriptions.keys()) {
      void pushMetrics(propertyId);
    }
  }, 15_000);
}
