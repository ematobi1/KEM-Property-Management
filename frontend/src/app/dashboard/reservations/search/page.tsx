'use client';

import { useState, useMemo } from 'react';
import TopBar from '@/components/layout/TopBar';
import type { Reservation, ReservationStatus, LoyaltyTier, DepositStatus } from '@/types';
import { MOCK_RESERVATIONS, MOCK_ARRIVALS, MOCK_DEPARTURES } from '@/lib/mock';

// ─── All reservations pool ────────────────────────────────────────────────────

const ALL_RESERVATIONS: Reservation[] = [
  ...MOCK_RESERVATIONS,
  ...MOCK_ARRIVALS,
  ...MOCK_DEPARTURES,
  // extra records for a richer search demo
  { id: 'x1', confirmationNumber: 'KEM-ZX9001', propertyId: 'p1', roomNumber: '106', guestFirstName: 'N***a', guestLastName: 'P****e', loyaltyTier: 'Diamond', earlyCheckInEligible: true, lateCheckOutEligible: true, depositStatus: 'Paid', status: 'InHouse', checkInDate: '2026-06-10', checkOutDate: '2026-06-18' },
  { id: 'x2', confirmationNumber: 'KEM-MN4422', propertyId: 'p1', roomNumber: null,  guestFirstName: 'T***s', guestLastName: 'O***u', loyaltyTier: 'None',    earlyCheckInEligible: false, lateCheckOutEligible: false, depositStatus: 'Pending', status: 'Arrival',   checkInDate: '2026-06-17', checkOutDate: '2026-06-20' },
  { id: 'x3', confirmationNumber: 'KEM-BC7733', propertyId: 'p1', roomNumber: '411', guestFirstName: 'E***a', guestLastName: 'V*****z', loyaltyTier: 'Gold',    earlyCheckInEligible: false, lateCheckOutEligible: true, depositStatus: 'Paid',    status: 'Departure', checkInDate: '2026-06-12', checkOutDate: '2026-06-16' },
  { id: 'x4', confirmationNumber: 'KEM-QW5511', propertyId: 'p1', roomNumber: '302', guestFirstName: 'M***o', guestLastName: 'A***s', loyaltyTier: 'Platinum', earlyCheckInEligible: true,  lateCheckOutEligible: false, depositStatus: 'Paid',    status: 'InHouse',   checkInDate: '2026-06-14', checkOutDate: '2026-06-19' },
  { id: 'x5', confirmationNumber: 'KEM-RT8844', propertyId: 'p1', roomNumber: '207', guestFirstName: 'F***i', guestLastName: 'K***a', loyaltyTier: 'Silver',   earlyCheckInEligible: false, lateCheckOutEligible: false, depositStatus: 'Future',  status: 'Arrival',   checkInDate: '2026-06-17', checkOutDate: '2026-06-21' },
  { id: 'x6', confirmationNumber: 'KEM-LY2266', propertyId: 'p1', roomNumber: '404', guestFirstName: 'P***a', guestLastName: 'N***g', loyaltyTier: 'None',    earlyCheckInEligible: false, lateCheckOutEligible: false, depositStatus: 'Paid',    status: 'NoShow',    checkInDate: '2026-06-16', checkOutDate: '2026-06-17' },
  { id: 'x7', confirmationNumber: 'KEM-HJ3355', propertyId: 'p1', roomNumber: null,  guestFirstName: 'W***m', guestLastName: 'S****n', loyaltyTier: 'Club',    earlyCheckInEligible: false, lateCheckOutEligible: false, depositStatus: 'Pending', status: 'Canceled',  checkInDate: '2026-06-18', checkOutDate: '2026-06-20' },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ReservationStatus, { label: string; badge: string; dot: string }> = {
  InHouse:   { label: 'In House',   badge: 'badge-green',  dot: 'dot-green' },
  Arrival:   { label: 'Arrival',    badge: 'badge-cyan',   dot: 'dot-cyan' },
  Departure: { label: 'Departure',  badge: 'badge-amber',  dot: 'dot-amber' },
  NoShow:    { label: 'No Show',    badge: 'badge-red',    dot: 'dot-red' },
  Canceled:  { label: 'Canceled',   badge: 'badge-gray',   dot: 'dot-gray' },
};

const TIER_CFG: Record<LoyaltyTier, { badge: string }> = {
  Diamond: { badge: 'badge-cyan' },
  Platinum:{ badge: 'badge-purple' },
  Gold:    { badge: 'badge-amber' },
  Silver:  { badge: 'badge-gray' },
  Club:    { badge: 'badge-gray' },
  None:    { badge: 'badge-gray' },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReservationSearchPage() {
  const [query, setQuery]               = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'All'>('All');
  const [tierFilter, setTierFilter]     = useState<LoyaltyTier | 'All'>('All');
  const [depositFilter, setDepositFilter] = useState<DepositStatus | 'All'>('All');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [selected, setSelected]         = useState<Reservation | null>(null);
  const [hasSearched, setHasSearched]   = useState(false);

  const results = useMemo(() => {
    if (!hasSearched) return [];
    const q = query.trim().toLowerCase();
    return ALL_RESERVATIONS.filter((r) => {
      const matchQuery = !q
        || r.confirmationNumber.toLowerCase().includes(q)
        || r.guestFirstName.toLowerCase().includes(q)
        || r.guestLastName.toLowerCase().includes(q)
        || (r.roomNumber?.toLowerCase() ?? '').includes(q);
      const matchStatus  = statusFilter  === 'All' || r.status        === statusFilter;
      const matchTier    = tierFilter    === 'All' || r.loyaltyTier   === tierFilter;
      const matchDeposit = depositFilter === 'All' || r.depositStatus === depositFilter;
      const matchFrom    = !dateFrom || r.checkInDate >= dateFrom;
      const matchTo      = !dateTo   || r.checkInDate <= dateTo;
      return matchQuery && matchStatus && matchTier && matchDeposit && matchFrom && matchTo;
    });
  }, [hasSearched, query, statusFilter, tierFilter, depositFilter, dateFrom, dateTo]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setHasSearched(true);
    setSelected(null);
  }

  function handleReset() {
    setQuery('');
    setStatusFilter('All');
    setTierFilter('All');
    setDepositFilter('All');
    setDateFrom('');
    setDateTo('');
    setHasSearched(false);
    setSelected(null);
  }

  return (
    <>
      <TopBar
        title="Reservation Search"
        subtitle="Find Reservations"
        actions={
          hasSearched
            ? <span className="badge badge-cyan text-[9px]">{results.length} RESULT{results.length !== 1 ? 'S' : ''}</span>
            : undefined
        }
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-5 animate-fade-in">

        {/* ── Search form ───────────────────────────────────────────────── */}
        <form onSubmit={handleSearch}>
          <div className="card-cyber rounded-sm p-5 brackets space-y-4">
            <p className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest">Search Criteria</p>

            {/* Text search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by confirmation #, guest name, or room number..."
                className="pms-input pl-9 text-sm"
              />
            </div>

            {/* Filter row 1 */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ReservationStatus | 'All')} className="pms-input">
                  <option value="All">All Statuses</option>
                  <option value="InHouse">In House</option>
                  <option value="Arrival">Arrival</option>
                  <option value="Departure">Departure</option>
                  <option value="NoShow">No Show</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Member Tier</label>
                <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value as LoyaltyTier | 'All')} className="pms-input">
                  <option value="All">All Tiers</option>
                  <option value="Diamond">Diamond</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Club">Club</option>
                  <option value="None">None</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Deposit</label>
                <select value={depositFilter} onChange={(e) => setDepositFilter(e.target.value as DepositStatus | 'All')} className="pms-input">
                  <option value="All">All</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Future">Future</option>
                </select>
              </div>
            </div>

            {/* Filter row 2 — date range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Check-In From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="pms-input font-mono" />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Check-In To</label>
                <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} className="pms-input font-mono" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn btn-solid-cyber flex-1 justify-center py-2.5 text-sm font-bold tracking-wider">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                Search Reservations
              </button>
              {hasSearched && (
                <button type="button" onClick={handleReset} className="btn btn-ghost px-5">
                  Clear
                </button>
              )}
            </div>
          </div>
        </form>

        {/* ── Results ───────────────────────────────────────────────────── */}
        {!hasSearched && (
          <div className="card-cyber rounded-sm p-12 text-center">
            <div className="w-14 h-14 rounded-sm bg-cyber/6 border border-cyber/15 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00CFFF" strokeWidth="1">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-400 mb-1">Search Reservations</p>
            <p className="text-[11px] font-mono text-slate-600">Enter criteria above and press Search to find reservations.</p>
            <p className="text-[10px] font-mono text-slate-700 mt-2">{ALL_RESERVATIONS.length} reservations in the system</p>
          </div>
        )}

        {hasSearched && (
          <div className="flex gap-5">

            {/* Table */}
            <div className="flex-1 min-w-0 space-y-3">
              {results.length === 0 ? (
                <div className="card-cyber rounded-sm p-10 text-center">
                  <p className="text-slate-600 font-mono text-xs">NO RESERVATIONS MATCH YOUR SEARCH</p>
                  <button onClick={handleReset} className="btn btn-ghost mt-4 text-[11px]">Clear & Try Again</button>
                </div>
              ) : (
                <>
                  <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                    {results.length} reservation{results.length !== 1 ? 's' : ''} found
                  </p>
                  <div className="card-cyber rounded-sm overflow-hidden">
                    <table className="pms-table">
                      <thead>
                        <tr>
                          <th>Conf. #</th>
                          <th>Guest</th>
                          <th>Room</th>
                          <th>Status</th>
                          <th>Tier</th>
                          <th>Check-In</th>
                          <th>Check-Out</th>
                          <th>Deposit</th>
                          <th>Flags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r) => {
                          const sc  = STATUS_CFG[r.status];
                          const tc  = TIER_CFG[r.loyaltyTier];
                          const isSel = selected?.id === r.id;
                          return (
                            <tr
                              key={r.id}
                              onClick={() => setSelected(isSel ? null : r)}
                              className={`cursor-pointer transition-colors ${isSel ? 'bg-cyber/[0.06]' : 'hover:bg-cyber/[0.03]'}`}
                            >
                              <td>
                                <span className="font-mono text-[11px] text-cyber/80">{r.confirmationNumber}</span>
                              </td>
                              <td>
                                <span className="font-medium text-slate-200">{r.guestLastName}, {r.guestFirstName}</span>
                              </td>
                              <td>
                                {r.roomNumber
                                  ? <span className="font-mono text-[12px] px-2 py-0.5 rounded-sm bg-space-700 border border-cyber/10 text-slate-300">{r.roomNumber}</span>
                                  : <span className="text-[10px] font-mono text-neon-amber/70 bg-neon-amber/5 border border-neon-amber/20 px-2 py-0.5 rounded-sm">UNASSIGNED</span>}
                              </td>
                              <td>
                                <div className="flex items-center gap-1.5">
                                  <span className={`status-dot ${sc.dot}`} style={{ width: 6, height: 6 }} />
                                  <span className={`badge ${sc.badge}`}>{sc.label}</span>
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${tc.badge}`}>{r.loyaltyTier === 'None' ? '—' : r.loyaltyTier}</span>
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
                                  {r.earlyCheckInEligible  && <span className="badge badge-purple text-[9px]">ECI</span>}
                                  {r.lateCheckOutEligible  && <span className="badge badge-cyan text-[9px]">LCO</span>}
                                  {!r.earlyCheckInEligible && !r.lateCheckOutEligible && <span className="text-slate-700 text-[10px]">—</span>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] font-mono text-slate-700 text-right">
                    SHOWING {results.length} OF {ALL_RESERVATIONS.length} TOTAL RECORDS
                  </p>
                </>
              )}
            </div>

            {/* Detail panel */}
            {selected && (
              <ReservationDetail
                reservation={selected}
                onClose={() => setSelected(null)}
              />
            )}
          </div>
        )}
      </main>
    </>
  );
}

// ─── Reservation Detail Panel ─────────────────────────────────────────────────

function ReservationDetail({ reservation: r, onClose }: { reservation: Reservation; onClose: () => void }) {
  const sc = STATUS_CFG[r.status];
  const tc = TIER_CFG[r.loyaltyTier];

  const nights = (() => {
    const diff = new Date(r.checkOutDate).getTime() - new Date(r.checkInDate).getTime();
    return Math.max(0, Math.floor(diff / 86400000));
  })();

  return (
    <div className="w-72 flex-shrink-0 space-y-3 animate-slide-in-left">

      {/* Header card */}
      <div className="card-cyber rounded-sm p-5 brackets">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Reservation Detail</span>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="cyber-divider mb-4" />

        {/* Conf number */}
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">Confirmation</p>
        <p className="font-mono text-lg font-bold text-cyber mb-3">{r.confirmationNumber}</p>

        {/* Guest */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-sm bg-neon-purple/10 border border-neon-purple/25 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">{r.guestLastName}, {r.guestFirstName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`badge ${tc.badge} text-[9px]`}>{r.loyaltyTier === 'None' ? 'No Tier' : r.loyaltyTier}</span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`status-dot ${sc.dot}`} style={{ width: 7, height: 7 }} />
          <span className={`badge ${sc.badge}`}>{sc.label}</span>
        </div>

        <div className="cyber-divider mb-4" />

        {/* Stay details */}
        <div className="space-y-2 text-[11px] font-mono">
          {[
            { label: 'Room',      value: r.roomNumber ?? 'Unassigned' },
            { label: 'Check-In',  value: r.checkInDate },
            { label: 'Check-Out', value: r.checkOutDate },
            { label: 'Nights',    value: String(nights) },
            { label: 'Deposit',   value: r.depositStatus },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-1 border-b border-cyber/5">
              <span className="text-slate-600">{label}</span>
              <span className={`text-slate-300 ${label === 'Nights' ? 'text-cyber font-bold' : ''}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Preference flags */}
        {(r.earlyCheckInEligible || r.lateCheckOutEligible) && (
          <div className="flex gap-1.5 mt-3">
            {r.earlyCheckInEligible  && <span className="badge badge-purple text-[9px]">Early Check-In</span>}
            {r.lateCheckOutEligible  && <span className="badge badge-cyan text-[9px]">Late Check-Out</span>}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="card-cyber rounded-sm p-4 space-y-2">
        <p className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-2">Quick Actions</p>
        {r.status === 'Arrival' && (
          <button className="btn btn-success w-full justify-center text-[11px]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13 12H3"/>
            </svg>
            Process Check-In
          </button>
        )}
        {r.status === 'Departure' && (
          <button className="btn btn-danger w-full justify-center text-[11px]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Express Check-Out
          </button>
        )}
        <button className="btn btn-ghost w-full justify-center text-[11px]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
          </svg>
          Print Reg Card
        </button>
        <button className="btn btn-ghost w-full justify-center text-[11px]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Modify Reservation
        </button>
      </div>
    </div>
  );
}
