'use client';

import { useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import type { Reservation } from '@/types';
import { MOCK_ARRIVALS } from '@/lib/mock';

export default function ArrivalsPage() {
  const [arrivals, setArrivals] = useState<Reservation[]>(MOCK_ARRIVALS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

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

  const unassigned = arrivals.filter((r) => !r.roomNumber).length;

  return (
    <>
      <TopBar
        title="Arrivals"
        subtitle="Check-In Processing"
        actions={
          <div className="flex items-center gap-2">
            <span className="badge badge-green">{arrivals.length} EXPECTED</span>
            {unassigned > 0 && (
              <span className="badge badge-amber">{unassigned} UNASSIGNED</span>
            )}
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-4 animate-fade-in">

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <span className="text-[11px] font-mono text-cyber">
                {selected.size} selected
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAutoAssign}
              disabled={selected.size === 0}
              className="btn btn-cyber"
            >
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
                      {r.roomNumber ? (
                        <span className="font-mono text-[12px] px-2 py-0.5 rounded-sm bg-space-700 border border-cyber/10 text-slate-300">
                          {r.roomNumber}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-neon-amber/80 bg-neon-amber/5 border border-neon-amber/20 px-2 py-0.5 rounded-sm">
                          UNASSIGNED
                        </span>
                      )}
                    </td>
                    <td>
                      <TierBadge tier={r.loyaltyTier} />
                    </td>
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
