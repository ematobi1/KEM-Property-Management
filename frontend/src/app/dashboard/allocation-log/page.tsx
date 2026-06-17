'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { getAllocationLog } from '@/lib/api/allocations';
import type { AllocationLog } from '@/lib/api/types';
import { ApiError } from '@/lib/api/client';

type AllocationTypeBadge = {
  cls: string;
  label: string;
};

const ALLOCATION_TYPE_MAP: Record<string, AllocationTypeBadge> = {
  SOFT_ALLOCATION:  { cls: 'badge-amber',  label: 'Soft' },
  AUTO_ASSIGNED:    { cls: 'badge-green',  label: 'Auto' },
  MANUAL_OVERRIDE:  { cls: 'badge-purple', label: 'Manual' },
};

function getUserRole(): string {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('pms_session') : null;
    if (!raw) return '';
    return (JSON.parse(raw) as { user: { role: string } }).user.role;
  } catch { return ''; }
}

export default function AllocationLogPage() {
  const [logs, setLogs] = useState<AllocationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const userRole = getUserRole();
  const hasAccess = userRole === 'Admin' || userRole === 'HousekeepingManager';

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sd = startDate ? new Date(startDate).toISOString() : undefined;
      const ed = endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined;
      const res = await getAllocationLog(sd, ed);
      setLogs(res.data);
      setTotal(res.meta.total);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load allocation log');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { if (hasAccess) void fetchLogs(); }, [fetchLogs, hasAccess]);

  if (!hasAccess) {
    return (
      <>
        <TopBar title="Allocation Log" subtitle="Room Assignment History" />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="card-cyber rounded-sm p-8 text-center max-w-sm">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF4757" strokeWidth="1.5" className="mx-auto mb-3">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <p className="text-sm font-semibold text-slate-300">Access Restricted</p>
            <p className="text-xs text-slate-600 mt-1">Manager or Admin role required</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Allocation Log"
        subtitle="Room Assignment History"
        actions={
          <span className="badge badge-amber text-[9px]">{total} ENTRIES</span>
        }
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-4 animate-fade-in">

        {/* Filters */}
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pms-input text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pms-input text-xs font-mono"
            />
          </div>
          <button onClick={fetchLogs} className="btn btn-cyber">Apply Filter</button>
          <button onClick={() => { setStartDate(''); setEndDate(''); }} className="btn btn-ghost">Clear</button>
        </div>

        {/* Table */}
        <div className="card-cyber rounded-sm overflow-hidden">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-neon-red/5 border-b border-neon-red/20">
              <span className="text-xs text-neon-red font-mono">{error}</span>
            </div>
          )}

          <table className="pms-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Reservation ID</th>
                <th>Room</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Allocated By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12">
                  <div className="inline-block w-24 h-4 rounded shimmer" />
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-slate-600 py-12 font-mono text-xs">
                  NO RECORDS IN SELECTED RANGE
                </td></tr>
              ) : logs.map((log) => {
                const badge = ALLOCATION_TYPE_MAP[log.allocationType] ?? { cls: 'badge-gray', label: log.allocationType };
                return (
                  <tr key={log.id}>
                    <td className="font-mono text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <span className="font-mono text-[10px] text-cyber/70">{log.reservationId.split('-')[0]}…</span>
                    </td>
                    <td>
                      <span className="font-mono text-[12px] px-2 py-0.5 rounded-sm bg-space-700 border border-cyber/10 text-slate-300">
                        {log.roomNumber}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${badge.cls} text-[9px]`}>{badge.label}</span>
                    </td>
                    <td className="text-[11px] text-slate-500 max-w-xs truncate">{log.reason}</td>
                    <td className="font-mono text-[11px] text-slate-500">{log.allocatedBy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </main>
    </>
  );
}
