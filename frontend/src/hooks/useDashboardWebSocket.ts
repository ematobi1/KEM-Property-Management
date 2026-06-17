'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getWsToken } from '@/lib/api/client';
import { getDashboardMetrics } from '@/lib/api/dashboard';
import type { ApiDashboardMetrics } from '@/lib/api/types';

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

const WS_BASE = process.env['NEXT_PUBLIC_WS_URL'] ?? 'ws://localhost:3000';
const MAX_BACKOFF_MS = 30_000;

export function useDashboardWebSocket() {
  const [metrics, setMetrics] = useState<ApiDashboardMetrics | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  const restFallback = useCallback(async () => {
    try {
      const data = await getDashboardMetrics();
      if (!unmountedRef.current) {
        setMetrics(data);
        setLastUpdate(new Date().toISOString());
      }
    } catch {
      // fallback silent
    }
  }, []);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;

    const token = getWsToken();
    if (!token) {
      setStatus('disconnected');
      setError('No auth token — please log in');
      void restFallback();
      return;
    }

    setStatus(retryCountRef.current === 0 ? 'connecting' : 'reconnecting');

    const ws = new WebSocket(`${WS_BASE}/ws/dashboard?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmountedRef.current) { ws.close(); return; }
      retryCountRef.current = 0;
      setStatus('connected');
      setError(null);
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(event.data) as {
          type: string;
          data: ApiDashboardMetrics;
          timestamp: string;
        };
        if (msg.type === 'DASHBOARD_UPDATE') {
          setMetrics(msg.data);
          setLastUpdate(msg.timestamp);
        }
      } catch {
        // malformed message — ignore
      }
    };

    ws.onerror = () => {
      void restFallback();
    };

    ws.onclose = () => {
      if (unmountedRef.current) return;
      wsRef.current = null;
      setStatus('reconnecting');

      const backoff = Math.min(1_000 * Math.pow(2, retryCountRef.current), MAX_BACKOFF_MS);
      retryCountRef.current += 1;

      retryTimerRef.current = setTimeout(() => {
        if (!unmountedRef.current) connect();
      }, backoff);
    };
  }, [restFallback]);

  const reconnect = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    wsRef.current?.close();
    retryCountRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { metrics, status, lastUpdate, error, reconnect };
}
