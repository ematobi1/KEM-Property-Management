'use client';

import { useState, useMemo } from 'react';
import TopBar from '@/components/layout/TopBar';
import type { Reservation, ReservationStatus, LoyaltyTier } from '@/types';
import { MOCK_RESERVATIONS } from '@/lib/mock';

const LOYALTY_CONFIG: Record<LoyaltyTier, { label: string; cls: string }> = {
  Diamond: { label: 'Diamond', cls: 'badge-cyan' },
  Platinum: { label: 'Platinum', cls: 'badge-purple' },
  Gold:     { label: 'Gold',    cls: 'badge-amber' },
  Silver:   { label: 'Silver',  cls: 'badge-gray' },
  Club:     { label: 'Club',    cls: 'badge-gray' },
  None:     { label: '—',       cls: 'badge-gray' },
};

const STATUS_CONFIG: Record<ReservationStatus, { label: string; cls: string; dot: string }> = {
  InHouse:   { label: 'In House',   cls: 'badge-green',  dot: 'dot-green' },
  Arrival:   { label: 'Arrival',    cls: 'badge-cyan',   dot: 'dot-cyan' },
  Departure: { label: 'Departure',  cls: 'badge-amber',  dot: 'dot-amber' },
  NoShow:    { label: 'No Show',    cls: 'badge-red',    dot: 'dot-red' },
  Canceled:  { label: 'Canceled',   cls: 'badge-gray',   dot: 'dot-gray' },
};

export default function InHousePage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'All'>('All');
  const [tierFilter, setTierFilter] = useState<LoyaltyTier | 'All'>('All');

  const filtered = useMemo(() => {
    return MOCK_RESERVATIONS.filter((r) => {
      const q = query.toLowerCase();
      const matchesQuery = !q ||
        r.confirmationNumber.toLowerCase().includes(q) ||
        (r.roomNumber?.toLowerCase() ?? '').includes(q) ||
        r.guestFirstName.toLowerCase().includes(q) ||
        r.guestLastName.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      const matchesTier = tierFilter === 'All' || r.loyaltyTier === tierFilter;
      return matchesQuery && matchesStatus && matchesTier;
    });
  }, [query, statusFilter, tierFilter]);

  return (
    <>
      <TopBar
        title="In-House"
        subtitle="Guest Management"
        actions={
          <span className="badge badge-cyan text-[9px]">
            {filtered.length} GUESTS
          </span>
        }
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-4 animate-fade-in">

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, conf. #, room..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pms-input pl-8 text-xs"
            />
          </div>

          <FilterChips
            options={['All', 'InHouse', 'Arrival', 'Departure', 'NoShow']}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as ReservationStatus | 'All')}
            labels={{ All: 'All Status', InHouse: 'In House', Arrival: 'Arrival', Departure: 'Departure', NoShow: 'No Show' }}
          />

          <FilterChips
            options={['All', 'Diamond', 'Platinum', 'Gold', 'Silver']}
            value={tierFilter}
            onChange={(v) => setTierFilter(v as LoyaltyTier | 'All')}
            labels={{ All: 'All Tiers' }}
          />
        </div>

        {/* Table */}
        <div className="card-cyber rounded-sm overflow-hidden">
          <table className="pms-table">
            <thead>
              <tr>
                <th>Conf. #</th>
                <th>Guest Name</th>
                <th>Room</th>
                <th>Member Tier</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Status</th>
                <th>Deposit</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-slate-600 py-12 font-mono text-xs">
                    NO RECORDS MATCH CURRENT FILTERS
                  </td>
                </tr>
              ) : filtered.map((r) => (
                <GuestRow key={r.id} reservation={r} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        <p className="text-[10px] font-mono text-slate-700 text-right">
          SHOWING {filtered.length} OF {MOCK_RESERVATIONS.length} RECORDS
        </p>
      </main>
    </>
  );
}

function GuestRow({ reservation: r }: { reservation: Reservation }) {
  const tier = LOYALTY_CONFIG[r.loyaltyTier];
  const status = STATUS_CONFIG[r.status];

  return (
    <tr>
      <td>
        <span className="font-mono text-[11px] text-cyber/80">{r.confirmationNumber}</span>
      </td>
      <td>
        <span className="font-medium">{r.guestLastName}, {r.guestFirstName}</span>
      </td>
      <td>
        {r.roomNumber ? (
          <span className="font-mono text-[12px] px-2 py-0.5 rounded-sm bg-space-700 border border-cyber/10 text-slate-300">
            {r.roomNumber}
          </span>
        ) : (
          <span className="text-slate-600 text-xs">—</span>
        )}
      </td>
      <td>
        <span className={`badge ${tier.cls}`}>{tier.label}</span>
      </td>
      <td className="font-mono text-xs text-slate-400">{r.checkInDate}</td>
      <td className="font-mono text-xs text-slate-400">{r.checkOutDate}</td>
      <td>
        <div className="flex items-center gap-1.5">
          <span className={`status-dot ${status.dot}`} style={{ width: 6, height: 6, flexShrink: 0 }} />
          <span className={`badge ${status.cls}`}>{status.label}</span>
        </div>
      </td>
      <td>
        <span className={`badge ${r.depositStatus === 'Paid' ? 'badge-green' : r.depositStatus === 'Pending' ? 'badge-amber' : 'badge-gray'}`}>
          {r.depositStatus}
        </span>
      </td>
      <td>
        <div className="flex gap-1">
          {r.earlyCheckInEligible && (
            <span className="badge badge-purple" title="Early Check-In">ECI</span>
          )}
          {r.lateCheckOutEligible && (
            <span className="badge badge-cyan" title="Late Check-Out">LCO</span>
          )}
          {!r.earlyCheckInEligible && !r.lateCheckOutEligible && (
            <span className="text-slate-700 text-[10px]">—</span>
          )}
        </div>
      </td>
    </tr>
  );
}

function FilterChips({
  options, value, onChange, labels = {},
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  labels?: Record<string, string>;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-sm border transition-all ${
            value === opt
              ? 'bg-cyber/15 border-cyber/40 text-cyber'
              : 'bg-transparent border-space-600 text-slate-600 hover:border-cyber/20 hover:text-slate-400'
          }`}
        >
          {labels[opt] ?? opt.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
