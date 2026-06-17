'use client';

import { useState, useEffect } from 'react';
import TopBar from '@/components/layout/TopBar';
import type { Reservation } from '@/types';
import { MOCK_ARRIVALS } from '@/lib/mock';
import { getPendingAllocations, confirmAllocation, overrideAllocation } from '@/lib/api/allocations';
import type { PendingAllocation } from '@/lib/api/types';
import { ApiError } from '@/lib/api/client';

type AllocationMap = Record<string, PendingAllocation>;

export default function ArrivalsPage() {
  const [arrivals, setArrivals] = useState<Reservation[]>(MOCK_ARRIVALS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [allocationMap, setAllocationMap] = useState<AllocationMap>({});
  const [panelResId, setPanelResId] = useState<string | null>(null);
  const [overrideRoom, setOverrideRoom] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    getPendingAllocations()
      .then((res) => {
        const map: AllocationMap = {};
        for (const alloc of res.data) {
          map[alloc.reservationId] = alloc;
        }
        setAllocationMap(map);
      })
      .catch(() => {
        // Backend not connected — silently skip allocation badges
      });
  }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === arrivals.length ? new Set() : new Set(arrivals.map((r) => r.id))
    );
  }

  async function handleCheckIn(id: string) {
    setCheckingIn(id);
    await new Promise((r) => setTimeout(r, 800));
    setArrivals((prev) => prev.filter((r) => r.id !== id));
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    setCheckingIn(null);
  }

  async function handleAutoAssign() {
    const ids = arrivals.filter((r) => !r.roomNumber && selected.has(r.id));
    if (ids.length === 0) return;
    await new Promise((r) => setTimeout(r, 600));
    setArrivals((prev) =>
      prev.map((r) =>
        selected.has(r.id) && !r.roomNumber
          ? { ...r, roomNumber: `${Math.floor(Math.random() * 4 + 1)}${String(Math.floor(Math.random() * 9 + 1)).padStart(2, '0')}` }
          : r
      )
    );
  }

  function openPanel(resId: string) {
    setPanelResId(resId);
    setOverrideRoom('');
    setOverrideReason('');
    setActionError(null);
  }

  function closePanel() {
    setPanelResId(null);
    setActionError(null);
  }

  async function handleConfirm(resId: string) {
    const alloc = allocationMap[resId];
    if (!alloc) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await confirmAllocation(resId, alloc.id);
      setAllocationMap((prev) => {
        const next = { ...prev };
        delete next[resId];
        return next;
      });
      setArrivals((prev) =>
        prev.map((r) => r.id === resId ? { ...r, roomNumber: alloc.roomNumber } : r)
      );
      closePanel();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Failed to confirm allocation');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleOverride(resId: string) {
    const alloc = allocationMap[resId];
    if (!alloc || !overrideRoom.trim()) { setActionError('Room number is required'); return; }
    setActionLoading(true);
    setActionError(null);
    try {
      await overrideAllocation(resId, overrideRoom.trim());
      setAllocationMap((prev) => {
        const next = { ...prev };
        delete next[resId];
        return next;
      });
      setArrivals((prev) =>
        prev.map((r) => r.id === resId ? { ...r, roomNumber: overrideRoom.trim() } : r)
      );
      closePanel();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Failed to override allocation');
    } finally {
      setActionLoading(false);
    }
  }

  const unassigned = arrivals.filter((r) => !r.roomNumber).length;
  const pendingCount = Object.keys(allocationMap).length;
  const panelAlloc = panelResId ? allocationMap[panelResId] : null;
  const panelRes = panelResId ? arrivals.find((r) => r.id === panelResId) : null;

  return (
    <>
      <TopBar
        title="Arrivals"
        subtitle="Check-In Processing"
        actions={
          <div className="flex items-center gap-2">
            <span className="badge badge-green">{arrivals.length} EXPECTED</span>
            {unassigned > 0 && <span className="badge badge-amber">{unassigned} UNASSIGNED</span>}
            {pendingCount > 0 && <span className="badge badge-purple">{pendingCount} SOFT ALLOC</span>}
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-4 animate-fade-in">

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <span className="text-[11px] font-mono text-cyber">{selected.size} selected</span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAutoAssign} disabled={selected.size === 0} className="btn btn-cyber">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              </svg>
              Auto Assign Rooms
            </button>
            <button className="btn btn-ghost">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print All Reg Cards
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card-cyber rounded-sm overflow-hidden">
          <table className="pms-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selected.size === arrivals.length && arrivals.length > 0}
                    onChange={toggleAll}
                    className="accent-cyber w-3 h-3"
                  />
                </th>
                <th>Conf. #</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Member Tier</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Deposit</th>
                <th>Flags</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {arrivals.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center text-neon-green font-mono text-xs py-12">
                    ✓ ALL ARRIVALS PROCESSED
                  </td>
                </tr>
              )}
              {arrivals.map((r) => {
                const isChecking = checkingIn === r.id;
                const alloc = allocationMap[r.id];
                return (
                  <tr key={r.id} className={selected.has(r.id) ? 'bg-cyber/[0.03]' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="accent-cyber w-3 h-3"
                      />
                    </td>
                    <td><span className="font-mono text-[11px] text-cyber/80">{r.confirmationNumber}</span></td>
                    <td><span className="font-medium">{r.guestLastName}, {r.guestFirstName}</span></td>
                    <td>
                      <div className="flex flex-col gap-1">
                        {r.roomNumber ? (
                          <span className="font-mono text-[12px] px-2 py-0.5 rounded-sm bg-space-700 border border-cyber/10 text-slate-300">
                            {r.roomNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-neon-amber/80 bg-neon-amber/5 border border-neon-amber/20 px-2 py-0.5 rounded-sm">
                            UNASSIGNED
                          </span>
                        )}
                        {alloc && (
                          <button
                            onClick={() => openPanel(r.id)}
                            className="flex items-center gap-1 text-[9px] font-mono text-neon-purple/90 bg-neon-purple/8 border border-neon-purple/20 px-2 py-0.5 rounded-sm hover:bg-neon-purple/15 transition-colors"
                          >
                            <span className="status-dot dot-purple" style={{ width: 4, height: 4 }} />
                            Room {alloc.roomNumber} suggested
                          </button>
                        )}
                      </div>
                    </td>
                    <td><TierBadge tier={r.loyaltyTier} /></td>
                    <td className="font-mono text-xs text-slate-400">{r.checkInDate}</td>
                    <td className="font-mono text-xs text-slate-400">{r.checkOutDate}</td>
                    <td>
                      <span className={`badge ${r.depositStatus === 'Paid' ? 'badge-green' : r.depositStatus === 'Pending' ? 'badge-amber' : 'badge-gray'}`}>
                        {r.depositStatus}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {r.earlyCheckInEligible && <span className="badge badge-purple">ECI</span>}
                        {r.lateCheckOutEligible && <span className="badge badge-cyan">LCO</span>}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleCheckIn(r.id)}
                        disabled={isChecking || !r.roomNumber}
                        className="btn btn-success py-1 px-2 text-[10px]"
                        title={!r.roomNumber ? 'Assign a room first' : 'Process check-in'}
                      >
                        {isChecking ? (
                          <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12a9 9 0 11-6.219-8.56"/>
                          </svg>
                        ) : (
                          <>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13 12H3"/>
                            </svg>
                            Check In
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* Allocation panel */}
      {panelResId && panelAlloc && panelRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closePanel} />
          <div className="relative card-cyber rounded-sm p-6 w-[420px] shadow-2xl animate-fade-in">

            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-mono font-bold text-neon-purple uppercase tracking-widest">Soft Allocation</p>
                <p className="text-sm font-semibold text-slate-200 mt-0.5">
                  {panelRes.guestLastName}, {panelRes.guestFirstName}
                </p>
                <p className="text-[10px] font-mono text-slate-600 mt-0.5">{panelRes.confirmationNumber}</p>
              </div>
              <button onClick={closePanel} className="btn btn-ghost p-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Suggested room */}
            <div className="p-4 rounded-sm bg-neon-purple/5 border border-neon-purple/20 mb-5">
              <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-2">Suggested Room</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-bold text-neon-purple">{panelAlloc.roomNumber}</span>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-slate-500">Reason</p>
                  <p className="text-xs text-slate-400 max-w-[180px] text-right">{panelAlloc.reason}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleConfirm(panelResId)}
              disabled={actionLoading}
              className="btn btn-success w-full justify-center mb-3"
            >
              {actionLoading ? 'Processing…' : `Confirm Room ${panelAlloc.roomNumber}`}
            </button>

            <div className="border-t border-cyber/10 pt-4 space-y-3">
              <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Override — Assign Different Room</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={overrideRoom}
                  onChange={(e) => setOverrideRoom(e.target.value)}
                  placeholder="Room number"
                  className="pms-input text-xs font-mono w-28 flex-shrink-0"
                  maxLength={4}
                />
                <input
                  type="text"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="pms-input text-xs flex-1"
                />
              </div>
              <button
                onClick={() => handleOverride(panelResId)}
                disabled={actionLoading || !overrideRoom.trim()}
                className="btn btn-cyber w-full justify-center"
              >
                Override Assignment
              </button>
            </div>

            {actionError && (
              <p className="text-neon-red text-xs font-mono mt-3">{actionError}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, string> = {
    Diamond: 'badge-cyan', Platinum: 'badge-purple',
    Gold: 'badge-amber', Silver: 'badge-gray', Club: 'badge-gray', None: 'badge-gray',
  };
  return <span className={`badge ${map[tier] ?? 'badge-gray'}`}>{tier === 'None' ? '—' : tier}</span>;
}
