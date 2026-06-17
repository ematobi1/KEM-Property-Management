'use client';

import { useState } from 'react';
import TopBar from '@/components/layout/TopBar';

// ─── Types ────────────────────────────────────────────────────────────────────

type FolioStatus = 'Open' | 'Settled' | 'Disputed';
type LineCategory = 'Accommodation' | 'F&B' | 'Taxes' | 'Amenities' | 'Deposit' | 'Payment' | 'Adjustment';
type Currency = 'USD' | 'EUR';

interface LineItem {
  id: string;
  date: string;
  description: string;
  category: LineCategory;
  debitCents: number;
  creditCents: number;
  postedBy: string;
}

interface Folio {
  id: string;
  confirmationNumber: string;
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  currency: Currency;
  status: FolioStatus;
  lineItems: LineItem[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const FOLIOS: Folio[] = [
  {
    id: 'f1', confirmationNumber: 'KEM-194823', guestName: 'M***a C***z', roomNumber: '301',
    checkIn: '2026-06-14', checkOut: '2026-06-18', currency: 'USD', status: 'Open',
    lineItems: [
      { id: 'li01', date: '2026-06-14', description: 'Room Charge — Night 1',          category: 'Accommodation', debitCents: 18900, creditCents: 0,     postedBy: 'System' },
      { id: 'li02', date: '2026-06-14', description: 'City / Municipal Tax',           category: 'Taxes',         debitCents: 1890,  creditCents: 0,     postedBy: 'System' },
      { id: 'li03', date: '2026-06-14', description: 'Deposit — Credit Card Auth',     category: 'Deposit',       debitCents: 0,     creditCents: 30000, postedBy: 'J. Mensah' },
      { id: 'li04', date: '2026-06-15', description: 'Room Charge — Night 2',          category: 'Accommodation', debitCents: 18900, creditCents: 0,     postedBy: 'System' },
      { id: 'li05', date: '2026-06-15', description: 'City / Municipal Tax',           category: 'Taxes',         debitCents: 1890,  creditCents: 0,     postedBy: 'System' },
      { id: 'li06', date: '2026-06-15', description: 'Restaurant — Dinner for Two',   category: 'F&B',           debitCents: 8400,  creditCents: 0,     postedBy: 'F&B POS' },
      { id: 'li07', date: '2026-06-16', description: 'Room Charge — Night 3',          category: 'Accommodation', debitCents: 18900, creditCents: 0,     postedBy: 'System' },
      { id: 'li08', date: '2026-06-16', description: 'City / Municipal Tax',           category: 'Taxes',         debitCents: 1890,  creditCents: 0,     postedBy: 'System' },
      { id: 'li09', date: '2026-06-16', description: 'Spa — Couple Massage 90 min',   category: 'Amenities',     debitCents: 22000, creditCents: 0,     postedBy: 'Spa POS' },
      { id: 'li10', date: '2026-06-16', description: 'Location Surcharge — 3 nights', category: 'Taxes',         debitCents: 900,   creditCents: 0,     postedBy: 'System' },
    ],
  },
  {
    id: 'f2', confirmationNumber: 'KEM-283741', guestName: 'R***t H***n', roomNumber: '415',
    checkIn: '2026-06-15', checkOut: '2026-06-17', currency: 'EUR', status: 'Open',
    lineItems: [
      { id: 'li1', date: '2026-06-15', description: 'Room Charge — Night 1',        category: 'Accommodation', debitCents: 21000, creditCents: 0,     postedBy: 'System' },
      { id: 'li2', date: '2026-06-15', description: 'VAT 10%',                      category: 'Taxes',         debitCents: 2100,  creditCents: 0,     postedBy: 'System' },
      { id: 'li3', date: '2026-06-15', description: 'Pre-payment (Wire Transfer)',  category: 'Payment',       debitCents: 0,     creditCents: 50000, postedBy: 'Finance' },
      { id: 'li4', date: '2026-06-16', description: 'Room Charge — Night 2',        category: 'Accommodation', debitCents: 21000, creditCents: 0,     postedBy: 'System' },
      { id: 'li5', date: '2026-06-16', description: 'VAT 10%',                      category: 'Taxes',         debitCents: 2100,  creditCents: 0,     postedBy: 'System' },
      { id: 'li6', date: '2026-06-16', description: 'Minibar Restock',              category: 'Amenities',     debitCents: 3500,  creditCents: 0,     postedBy: 'Housekeeping' },
    ],
  },
  {
    id: 'f3', confirmationNumber: 'KEM-371920', guestName: 'A***a O***i', roomNumber: '202',
    checkIn: '2026-06-16', checkOut: '2026-06-19', currency: 'USD', status: 'Open',
    lineItems: [
      { id: 'li1', date: '2026-06-16', description: 'Room Charge — Night 1',       category: 'Accommodation', debitCents: 15500, creditCents: 0,     postedBy: 'System' },
      { id: 'li2', date: '2026-06-16', description: 'City Tax',                    category: 'Taxes',         debitCents: 1550,  creditCents: 0,     postedBy: 'System' },
      { id: 'li3', date: '2026-06-16', description: 'Breakfast Package',           category: 'F&B',           debitCents: 2800,  creditCents: 0,     postedBy: 'System' },
      { id: 'li4', date: '2026-06-16', description: 'Deposit — Credit Card Auth', category: 'Deposit',       debitCents: 0,     creditCents: 20000, postedBy: 'A. Chen' },
    ],
  },
  {
    id: 'f4', confirmationNumber: 'KEM-445812', guestName: 'D***s K***g', roomNumber: '118',
    checkIn: '2026-06-13', checkOut: '2026-06-16', currency: 'USD', status: 'Settled',
    lineItems: [
      { id: 'li1', date: '2026-06-13', description: 'Room Charge — Night 1',     category: 'Accommodation', debitCents: 12000, creditCents: 0,     postedBy: 'System' },
      { id: 'li2', date: '2026-06-13', description: 'City Tax',                  category: 'Taxes',         debitCents: 1200,  creditCents: 0,     postedBy: 'System' },
      { id: 'li3', date: '2026-06-14', description: 'Room Charge — Night 2',     category: 'Accommodation', debitCents: 12000, creditCents: 0,     postedBy: 'System' },
      { id: 'li4', date: '2026-06-14', description: 'City Tax',                  category: 'Taxes',         debitCents: 1200,  creditCents: 0,     postedBy: 'System' },
      { id: 'li5', date: '2026-06-15', description: 'Room Charge — Night 3',     category: 'Accommodation', debitCents: 12000, creditCents: 0,     postedBy: 'System' },
      { id: 'li6', date: '2026-06-15', description: 'City Tax',                  category: 'Taxes',         debitCents: 1200,  creditCents: 0,     postedBy: 'System' },
      { id: 'li7', date: '2026-06-16', description: 'Final Payment — Visa Card', category: 'Payment',       debitCents: 0,     creditCents: 39600, postedBy: 'J. Mensah' },
    ],
  },
  {
    id: 'f5', confirmationNumber: 'KEM-512938', guestName: 'P***r V***n', roomNumber: '520',
    checkIn: '2026-06-14', checkOut: '2026-06-20', currency: 'USD', status: 'Disputed',
    lineItems: [
      { id: 'li1', date: '2026-06-14', description: 'Room Charge — Night 1',      category: 'Accommodation', debitCents: 32000,  creditCents: 0,      postedBy: 'System' },
      { id: 'li2', date: '2026-06-14', description: 'Suite Premium Surcharge',    category: 'Accommodation', debitCents: 5000,   creditCents: 0,      postedBy: 'System' },
      { id: 'li3', date: '2026-06-14', description: 'City Tax',                   category: 'Taxes',         debitCents: 3700,   creditCents: 0,      postedBy: 'System' },
      { id: 'li4', date: '2026-06-15', description: 'Room Charge — Night 2',      category: 'Accommodation', debitCents: 32000,  creditCents: 0,      postedBy: 'System' },
      { id: 'li5', date: '2026-06-15', description: 'City Tax',                   category: 'Taxes',         debitCents: 3200,   creditCents: 0,      postedBy: 'System' },
      { id: 'li6', date: '2026-06-15', description: 'Minibar — Disputed Charge',  category: 'Amenities',     debitCents: 4500,   creditCents: 0,      postedBy: 'Housekeeping' },
      { id: 'li7', date: '2026-06-15', description: 'Deposit — Corporate Card',   category: 'Deposit',       debitCents: 0,      creditCents: 100000, postedBy: 'Finance' },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(cents: number, currency: Currency): string {
  const val = (cents / 100).toFixed(2);
  return currency === 'EUR' ? `€${val}` : `$${val}`;
}

function folioBalance(folio: Folio): number {
  return folio.lineItems.reduce((s, l) => s + l.debitCents - l.creditCents, 0);
}

function revenueAllocation(folio: Folio) {
  const sum = (cat: LineCategory) =>
    folio.lineItems.filter((l) => l.category === cat).reduce((s, l) => s + l.debitCents, 0);
  return {
    accommodation: sum('Accommodation'),
    fnb:           sum('F&B'),
    taxes:         sum('Taxes'),
    amenities:     sum('Amenities'),
  };
}

const CATEGORY_BADGE: Record<LineCategory, string> = {
  Accommodation: 'badge-cyan',
  'F&B':         'badge-green',
  Taxes:         'badge-amber',
  Amenities:     'badge-purple',
  Deposit:       'badge-gray',
  Payment:       'badge-green',
  Adjustment:    'badge-gray',
};

const CATEGORY_COLOR: Record<LineCategory, string> = {
  Accommodation: 'text-cyber',
  'F&B':         'text-neon-green',
  Taxes:         'text-neon-amber',
  Amenities:     'text-neon-purple',
  Deposit:       'text-slate-400',
  Payment:       'text-neon-green',
  Adjustment:    'text-slate-400',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FolioLedgerPage() {
  const [selectedId, setSelectedId] = useState<string>(FOLIOS[0].id);

  const folio        = FOLIOS.find((f) => f.id === selectedId)!;
  const balance      = folioBalance(folio);
  const alloc        = revenueAllocation(folio);
  const totalDebits  = folio.lineItems.reduce((s, l) => s + l.debitCents, 0);
  const totalCredits = folio.lineItems.reduce((s, l) => s + l.creditCents, 0);

  const openCount     = FOLIOS.filter((f) => f.status === 'Open').length;
  const disputedCount = FOLIOS.filter((f) => f.status === 'Disputed').length;

  return (
    <>
      <TopBar
        title="Folio & Ledger"
        subtitle="Multi-currency guest folio management · Integer cent arithmetic"
        actions={
          <div className="flex gap-2">
            <span className="badge badge-cyan text-[9px]">USD · EUR</span>
            <span className="badge badge-amber text-[9px]">{openCount} Open Folios</span>
            {disputedCount > 0 && <span className="badge badge-red text-[9px]">{disputedCount} Disputed</span>}
          </div>
        }
      />

      <main className="flex-1 overflow-hidden flex animate-fade-in">

        {/* ── Folio List ──────────────────────────────────────────────── */}
        <aside className="w-64 flex-shrink-0 border-r border-cyber/8 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-cyber/8">
            <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Active Folios ({FOLIOS.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {FOLIOS.map((f) => {
              const bal      = folioBalance(f);
              const isActive = f.id === selectedId;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedId(f.id)}
                  className={`w-full text-left px-4 py-3 border-b border-cyber/5 transition-all ${
                    isActive
                      ? 'bg-cyber/5 border-l-2 border-l-cyber'
                      : 'hover:bg-space-700/30 border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-cyber/70">{f.confirmationNumber}</span>
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-sm ${
                      f.status === 'Open'     ? 'bg-neon-green/10 text-neon-green' :
                      f.status === 'Settled'  ? 'bg-slate-700 text-slate-400' :
                      'bg-neon-red/10 text-neon-red'
                    }`}>{f.status}</span>
                  </div>
                  <p className="text-[12px] font-medium text-slate-200 truncate">{f.guestName}</p>
                  <p className="text-[10px] font-mono text-slate-600 mt-0.5">Room {f.roomNumber} · {f.currency}</p>
                  <p className={`text-[12px] font-mono font-bold mt-1 ${
                    bal === 0 ? 'text-neon-green' : bal > 0 ? 'text-neon-amber' : 'text-neon-red'
                  }`}>
                    {bal === 0 ? 'Balanced' : bal > 0 ? `${fmt(bal, f.currency)} due` : `${fmt(Math.abs(bal), f.currency)} credit`}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Folio Detail ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Folio header card */}
          <div className="card-cyber rounded-sm p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[13px] font-bold text-cyber">{folio.confirmationNumber}</span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-sm border ${
                    folio.status === 'Open'     ? 'bg-neon-green/10 text-neon-green border-neon-green/20' :
                    folio.status === 'Settled'  ? 'bg-slate-700 text-slate-400 border-slate-600' :
                    'bg-neon-red/10 text-neon-red border-neon-red/20'
                  }`}>{folio.status}</span>
                  <span className="badge badge-gray text-[9px]">{folio.currency}</span>
                </div>
                <p className="text-[15px] font-semibold text-slate-100">{folio.guestName}</p>
                <p className="text-[11px] font-mono text-slate-500 mt-1">
                  Room {folio.roomNumber} &nbsp;·&nbsp; {folio.checkIn} &rarr; {folio.checkOut}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-1">Current Balance</p>
                <p className={`text-2xl font-mono font-bold ${
                  balance === 0 ? 'text-neon-green' : balance > 0 ? 'text-neon-amber' : 'text-neon-red'
                }`}>
                  {balance === 0 ? 'Settled' : fmt(Math.abs(balance), folio.currency)}
                </p>
                {balance !== 0 && (
                  <p className="text-[10px] font-mono text-slate-600">{balance > 0 ? 'amount due' : 'credit balance'}</p>
                )}
              </div>
            </div>

            {/* Revenue allocation bar */}
            <div className="mt-4">
              <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-2">Revenue Allocation Split</p>
              {totalDebits > 0 && (
                <div className="h-2 flex rounded-full overflow-hidden gap-px">
                  {alloc.accommodation > 0 && <div className="bg-cyber/70"        style={{ width: `${(alloc.accommodation / totalDebits) * 100}%` }} />}
                  {alloc.fnb > 0          && <div className="bg-neon-green/70"   style={{ width: `${(alloc.fnb / totalDebits) * 100}%` }} />}
                  {alloc.taxes > 0        && <div className="bg-neon-amber/70"   style={{ width: `${(alloc.taxes / totalDebits) * 100}%` }} />}
                  {alloc.amenities > 0    && <div className="bg-neon-purple/70"  style={{ width: `${(alloc.amenities / totalDebits) * 100}%` }} />}
                </div>
              )}
              <div className="flex gap-4 mt-2">
                {[
                  { label: 'Accommodation', value: alloc.accommodation, colorDot: 'bg-cyber/70',       colorText: 'text-cyber' },
                  { label: 'F&B',           value: alloc.fnb,           colorDot: 'bg-neon-green/70',  colorText: 'text-neon-green' },
                  { label: 'Taxes',         value: alloc.taxes,         colorDot: 'bg-neon-amber/70',  colorText: 'text-neon-amber' },
                  { label: 'Amenities',     value: alloc.amenities,     colorDot: 'bg-neon-purple/70', colorText: 'text-neon-purple' },
                ].map((a) => (
                  <div key={a.label} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-sm ${a.colorDot}`} />
                    <span className="text-[9px] font-mono text-slate-600">{a.label}</span>
                    <span className={`text-[10px] font-mono font-bold ${a.colorText}`}>{fmt(a.value, folio.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div className="card-cyber rounded-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-cyber/8">
              <div>
                <p className="text-[11px] font-semibold text-slate-200">Ledger Line Items</p>
                <p className="text-[9px] font-mono text-slate-600 mt-0.5">
                  All amounts in {folio.currency} · integer cent arithmetic · immutable post-posting
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-slate-500">
                  Debits: <span className="text-neon-amber font-bold">{fmt(totalDebits, folio.currency)}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Credits: <span className="text-neon-green font-bold">{fmt(totalCredits, folio.currency)}</span>
                </span>
              </div>
            </div>
            <table className="pms-table">
              <thead>
                <tr>
                  <th>Date</th><th>Description</th><th>Category</th>
                  <th>Debit</th><th>Credit</th><th>Posted By</th>
                </tr>
              </thead>
              <tbody>
                {folio.lineItems.map((li) => (
                  <tr key={li.id}>
                    <td className="font-mono text-xs text-slate-500">{li.date}</td>
                    <td><span className="text-[11px] text-slate-300">{li.description}</span></td>
                    <td>
                      <span className={`badge text-[9px] ${CATEGORY_BADGE[li.category]}`}>{li.category}</span>
                    </td>
                    <td>
                      {li.debitCents > 0
                        ? <span className={`font-mono font-bold text-[12px] ${CATEGORY_COLOR[li.category]}`}>{fmt(li.debitCents, folio.currency)}</span>
                        : <span className="text-slate-700 text-[10px]">—</span>}
                    </td>
                    <td>
                      {li.creditCents > 0
                        ? <span className="font-mono font-bold text-[12px] text-neon-green">{fmt(li.creditCents, folio.currency)}</span>
                        : <span className="text-slate-700 text-[10px]">—</span>}
                    </td>
                    <td><span className="text-[10px] font-mono text-slate-600">{li.postedBy}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Settlement actions */}
          {folio.status !== 'Settled' && (
            <div className="card-cyber rounded-sm p-4">
              <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-3">Settlement Actions</p>
              <div className="flex items-center gap-2 flex-wrap">
                <button className="btn btn-cyber text-[11px]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Post Charge
                </button>
                <button className="btn btn-success text-[11px]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14m-7-7l7 7 7-7"/>
                  </svg>
                  Apply Payment
                </button>
                <button className="btn btn-ghost text-[11px]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/>
                    <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
                  </svg>
                  Transfer Charges
                </button>
                {balance === 0 && (
                  <button className="btn btn-success text-[11px] ml-auto">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Close Folio
                  </button>
                )}
                {folio.status === 'Disputed' && (
                  <button className="btn btn-danger text-[11px]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Resolve Dispute
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
