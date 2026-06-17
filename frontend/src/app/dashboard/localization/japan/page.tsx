'use client';

import { useState } from 'react';
import TopBar from '@/components/layout/TopBar';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'surcharge' | 'pkg-splits' | 'corporate-ar';

interface SurchargeRecord {
  roomNumber: string;
  guestName: string;
  adults: number;
  children: number;
  nights: number;
  taxPerAdultCents: number;
  taxPerChildCents: number;
  applied: boolean;
  checkInDate: string;
}

interface PackageSplitRecord {
  confirmationNumber: string;
  guestName: string;
  roomNumber: string;
  planName: string;
  grossRateCents: number;
  lodgingAllocationCents: number;
  diningAllocationCents: number;
  breakfastAllocationCents: number;
  nights: number;
}

interface CorporateAccount {
  id: string;
  companyName: string;
  accountCode: string;
  billingCycle: 'Monthly' | 'Quarterly';
  outstandingCents: number;
  lastBatchDate: string;
  lastBatchStatus: 'Settled' | 'Pending' | 'Disputed';
  reservationCount: number;
  contactEmail: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const SURCHARGE_RECORDS: SurchargeRecord[] = [
  { roomNumber: '201', guestName: 'T***o S***o', adults: 2, children: 0, nights: 3, taxPerAdultCents: 150, taxPerChildCents: 0,  applied: true,  checkInDate: '2026-06-14' },
  { roomNumber: '305', guestName: 'Y***o K***i', adults: 2, children: 1, nights: 2, taxPerAdultCents: 150, taxPerChildCents: 75, applied: true,  checkInDate: '2026-06-15' },
  { roomNumber: '112', guestName: 'H***o T***a', adults: 1, children: 0, nights: 4, taxPerAdultCents: 150, taxPerChildCents: 0,  applied: false, checkInDate: '2026-06-16' },
  { roomNumber: '418', guestName: 'A***o M***a', adults: 2, children: 2, nights: 1, taxPerAdultCents: 150, taxPerChildCents: 75, applied: true,  checkInDate: '2026-06-15' },
  { roomNumber: '223', guestName: 'K***i N***a', adults: 3, children: 0, nights: 2, taxPerAdultCents: 150, taxPerChildCents: 0,  applied: false, checkInDate: '2026-06-16' },
  { roomNumber: '321', guestName: 'R***o I***e', adults: 2, children: 0, nights: 5, taxPerAdultCents: 150, taxPerChildCents: 0,  applied: true,  checkInDate: '2026-06-13' },
  { roomNumber: '104', guestName: 'M***o F***a', adults: 1, children: 1, nights: 2, taxPerAdultCents: 150, taxPerChildCents: 75, applied: false, checkInDate: '2026-06-16' },
  { roomNumber: '402', guestName: 'S***o O***a', adults: 4, children: 0, nights: 1, taxPerAdultCents: 150, taxPerChildCents: 0,  applied: true,  checkInDate: '2026-06-16' },
];

const PACKAGE_SPLITS: PackageSplitRecord[] = [
  { confirmationNumber: 'KEM-001001', guestName: 'T***o S***o', roomNumber: '201', planName: 'Premier Full Board',  grossRateCents: 48000, lodgingAllocationCents: 22000, diningAllocationCents: 18000, breakfastAllocationCents: 8000, nights: 3 },
  { confirmationNumber: 'KEM-001002', guestName: 'Y***o K***i', roomNumber: '305', planName: 'Breakfast Included',  grossRateCents: 28000, lodgingAllocationCents: 22000, diningAllocationCents: 0,     breakfastAllocationCents: 6000, nights: 2 },
  { confirmationNumber: 'KEM-001003', guestName: 'H***o T***a', roomNumber: '112', planName: 'Premier Full Board',  grossRateCents: 52000, lodgingAllocationCents: 25000, diningAllocationCents: 20000, breakfastAllocationCents: 7000, nights: 4 },
  { confirmationNumber: 'KEM-001004', guestName: 'A***o M***a', roomNumber: '418', planName: 'Room Only',           grossRateCents: 18000, lodgingAllocationCents: 18000, diningAllocationCents: 0,     breakfastAllocationCents: 0,    nights: 1 },
  { confirmationNumber: 'KEM-001005', guestName: 'K***i N***a', roomNumber: '223', planName: 'Half Board (Dinner)', grossRateCents: 38000, lodgingAllocationCents: 22000, diningAllocationCents: 16000, breakfastAllocationCents: 0,    nights: 2 },
  { confirmationNumber: 'KEM-001006', guestName: 'R***o I***e', roomNumber: '321', planName: 'Premier Full Board',  grossRateCents: 55000, lodgingAllocationCents: 28000, diningAllocationCents: 19000, breakfastAllocationCents: 8000, nights: 5 },
];

const CORPORATE_ACCOUNTS: CorporateAccount[] = [
  { id: 'ca1', companyName: 'Meridian Global Ltd.',   accountCode: 'MGP-001', billingCycle: 'Monthly',   outstandingCents: 124000, lastBatchDate: '2026-05-31', lastBatchStatus: 'Settled',  reservationCount: 14, contactEmail: 'ap@meridian.com' },
  { id: 'ca2', companyName: 'Atlas Holdings Group',   accountCode: 'ATH-002', billingCycle: 'Monthly',   outstandingCents: 87000,  lastBatchDate: '2026-05-31', lastBatchStatus: 'Pending',  reservationCount: 9,  contactEmail: 'finance@atlas.com' },
  { id: 'ca3', companyName: 'Nexus Enterprises Inc.', accountCode: 'NEX-003', billingCycle: 'Monthly',   outstandingCents: 53000,  lastBatchDate: '2026-05-31', lastBatchStatus: 'Settled',  reservationCount: 6,  contactEmail: 'billing@nexus.com' },
  { id: 'ca4', companyName: 'Vantage Corporation',    accountCode: 'VCO-004', billingCycle: 'Quarterly', outstandingCents: 318000, lastBatchDate: '2026-03-31', lastBatchStatus: 'Disputed', reservationCount: 31, contactEmail: 'ar@vantage.com' },
  { id: 'ca5', companyName: 'Pacific Ventures Corp.', accountCode: 'PVC-005', billingCycle: 'Monthly',   outstandingCents: 0,      lastBatchDate: '2026-05-31', lastBatchStatus: 'Settled',  reservationCount: 4,  contactEmail: 'pay@pacific.com' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function surchargeForRecord(r: SurchargeRecord): number {
  return (r.adults * r.taxPerAdultCents + r.children * r.taxPerChildCents) * r.nights;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PackagesRevenuePage() {
  const [tab, setTab] = useState<Tab>('surcharge');
  const [surchargeRecords, setSurchargeRecords] = useState<SurchargeRecord[]>(SURCHARGE_RECORDS);
  const [runningBatch, setRunningBatch] = useState(false);
  const [batchDone, setBatchDone] = useState(false);

  const totalCollected = surchargeRecords.filter((r) => r.applied).reduce((s, r) => s + surchargeForRecord(r), 0);
  const pendingAmt     = surchargeRecords.filter((r) => !r.applied).reduce((s, r) => s + surchargeForRecord(r), 0);

  function applySurcharge(roomNumber: string) {
    setSurchargeRecords((prev) => prev.map((r) => r.roomNumber === roomNumber ? { ...r, applied: true } : r));
  }

  async function runMonthlyBatch() {
    setRunningBatch(true);
    await new Promise((res) => setTimeout(res, 1800));
    setRunningBatch(false);
    setBatchDone(true);
    setTimeout(() => setBatchDone(false), 5000);
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'surcharge',    label: 'Location Surcharge' },
    { id: 'pkg-splits',   label: 'Package Revenue Splits' },
    { id: 'corporate-ar', label: 'Corporate AR' },
  ];

  return (
    <>
      <TopBar
        title="Packages & Revenue"
        subtitle="Surcharge Compliance · Immutable Package Splits · Corporate AR"
        actions={
          <div className="flex gap-2">
            <span className="badge badge-cyan text-[9px]">USD · ISO 4217</span>
            <span className="badge badge-amber text-[9px]">Enterprise Billing</span>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-5 animate-fade-in">

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-cyber/10">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 pb-3 -mb-px border-b-2 transition-all ${
                tab === t.id ? 'text-cyber border-cyber' : 'text-slate-600 border-transparent hover:text-slate-400'
              }`}
            >
              <span className="text-xs font-mono font-bold uppercase tracking-widest">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Location Surcharge ─────────────────────────────────────────── */}
        {tab === 'surcharge' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Surcharge Collected', value: usd(totalCollected), color: 'text-neon-green' },
                { label: 'Pending',             value: usd(pendingAmt),     color: 'text-neon-amber' },
                { label: 'Rate per Adult',      value: '$1.50 / night',     color: 'text-cyber' },
              ].map((s) => (
                <div key={s.label} className="card-cyber rounded-sm p-4 brackets">
                  <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-2">{s.label}</p>
                  <p className={`text-xl font-mono font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="card-cyber rounded-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-cyber/8">
                <div>
                  <p className="text-[11px] font-semibold text-slate-200">Nightly Location Surcharge Ledger</p>
                  <p className="text-[9px] font-mono text-slate-600 mt-0.5">$1.50/adult · $0.75/child per night · Statutory flat-rate compliance fee</p>
                </div>
                <span className="badge badge-amber text-[9px]">{surchargeRecords.filter((r) => !r.applied).length} Pending</span>
              </div>
              <table className="pms-table">
                <thead>
                  <tr>
                    <th>Room</th><th>Guest</th><th>Adults</th><th>Children</th><th>Nights</th>
                    <th>Surcharge (USD)</th><th>Check-In</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {surchargeRecords.map((r) => {
                    const amt = surchargeForRecord(r);
                    return (
                      <tr key={r.roomNumber}>
                        <td><span className="font-mono text-[12px] px-2 py-0.5 rounded-sm bg-space-700 border border-cyber/10 text-slate-300">{r.roomNumber}</span></td>
                        <td><span className="text-slate-300">{r.guestName}</span></td>
                        <td className="font-mono text-slate-400">{r.adults}</td>
                        <td className="font-mono text-slate-400">{r.children}</td>
                        <td className="font-mono text-slate-400">{r.nights}</td>
                        <td><span className="font-mono font-bold text-neon-amber">{usd(amt)}</span></td>
                        <td className="font-mono text-xs text-slate-500">{r.checkInDate}</td>
                        <td>
                          {r.applied
                            ? <span className="badge badge-green text-[9px]">Applied</span>
                            : <span className="badge badge-amber text-[9px]">Pending</span>}
                        </td>
                        <td>
                          {!r.applied && (
                            <button onClick={() => applySurcharge(r.roomNumber)} className="btn btn-success py-1 px-2 text-[10px]">
                              Apply
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Package Revenue Splits ─────────────────────────────────────── */}
        {tab === 'pkg-splits' && (
          <div className="space-y-4">
            <div className="card-cyber rounded-sm p-4">
              <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">Immutable Allocation Engine</p>
              <p className="text-[11px] text-slate-500">Gross bundle rates are immutably split into discrete revenue codes at the time of posting. Values are stored as integer USD cents to eliminate floating-point drift. Splits cannot be edited post-posting — a reversal transaction must be created.</p>
              <div className="flex gap-3 mt-3">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-cyber/70" /><span className="text-[10px] font-mono text-slate-500">lodging_allocation</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-neon-purple/70" /><span className="text-[10px] font-mono text-slate-500">dining_allocation</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-neon-amber/70" /><span className="text-[10px] font-mono text-slate-500">breakfast_allocation</span></div>
              </div>
            </div>

            <div className="card-cyber rounded-sm overflow-hidden">
              <table className="pms-table">
                <thead>
                  <tr>
                    <th>Conf. #</th><th>Guest</th><th>Room</th><th>Plan</th><th>Nights</th>
                    <th>Gross Rate</th><th>Lodging</th><th>Dining</th><th>Breakfast</th><th>Allocation Check</th>
                  </tr>
                </thead>
                <tbody>
                  {PACKAGE_SPLITS.map((mp) => {
                    const totalAlloc = mp.lodgingAllocationCents + mp.diningAllocationCents + mp.breakfastAllocationCents;
                    const balanced   = totalAlloc === mp.grossRateCents;
                    return (
                      <tr key={mp.confirmationNumber}>
                        <td><span className="font-mono text-[11px] text-cyber/80">{mp.confirmationNumber}</span></td>
                        <td><span className="text-slate-300">{mp.guestName}</span></td>
                        <td><span className="font-mono text-[12px] px-2 py-0.5 rounded-sm bg-space-700 border border-cyber/10 text-slate-300">{mp.roomNumber}</span></td>
                        <td><span className="text-[11px] text-slate-400">{mp.planName}</span></td>
                        <td className="font-mono text-slate-400">{mp.nights}</td>
                        <td><span className="font-mono font-bold text-slate-200">{usd(mp.grossRateCents)}</span></td>
                        <td>
                          <div>
                            <p className="font-mono text-[11px] text-cyber">{usd(mp.lodgingAllocationCents)}</p>
                            <div className="h-0.5 mt-1 rounded-full bg-cyber/40" style={{ width: `${(mp.lodgingAllocationCents / mp.grossRateCents) * 60}px` }} />
                          </div>
                        </td>
                        <td>
                          {mp.diningAllocationCents > 0
                            ? <div><p className="font-mono text-[11px] text-neon-purple">{usd(mp.diningAllocationCents)}</p><div className="h-0.5 mt-1 rounded-full bg-neon-purple/40" style={{ width: `${(mp.diningAllocationCents / mp.grossRateCents) * 60}px` }} /></div>
                            : <span className="text-slate-700 text-xs">—</span>}
                        </td>
                        <td>
                          {mp.breakfastAllocationCents > 0
                            ? <div><p className="font-mono text-[11px] text-neon-amber">{usd(mp.breakfastAllocationCents)}</p><div className="h-0.5 mt-1 rounded-full bg-neon-amber/40" style={{ width: `${(mp.breakfastAllocationCents / mp.grossRateCents) * 60}px` }} /></div>
                            : <span className="text-slate-700 text-xs">—</span>}
                        </td>
                        <td>
                          {balanced
                            ? <span className="badge badge-green text-[9px]">&#10003; Balanced</span>
                            : <span className="badge badge-red text-[9px]">&#9888; Mismatch</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Corporate AR ──────────────────────────────────────────────── */}
        {tab === 'corporate-ar' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Outstanding', value: usd(CORPORATE_ACCOUNTS.reduce((s, a) => s + a.outstandingCents, 0)), color: 'text-neon-amber' },
                { label: 'Active Accounts',   value: String(CORPORATE_ACCOUNTS.length),                                    color: 'text-cyber' },
                { label: 'Disputed',          value: String(CORPORATE_ACCOUNTS.filter((a) => a.lastBatchStatus === 'Disputed').length), color: 'text-neon-red' },
              ].map((s) => (
                <div key={s.label} className="card-cyber rounded-sm p-4 brackets">
                  <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-2">{s.label}</p>
                  <p className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Consolidated Monthly Corporate Billing</p>
              {batchDone ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-neon-green/8 border border-neon-green/20">
                  <span className="status-dot dot-green" style={{ width: 6, height: 6 }} />
                  <span className="text-[10px] font-mono text-neon-green">Batch complete — invoices queued</span>
                </div>
              ) : (
                <button onClick={runMonthlyBatch} disabled={runningBatch} className="btn btn-cyber text-[11px]">
                  {runningBatch
                    ? <><svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Running…</>
                    : 'Run Monthly Batch'}
                </button>
              )}
            </div>

            <div className="card-cyber rounded-sm overflow-hidden">
              <table className="pms-table">
                <thead>
                  <tr>
                    <th>Code</th><th>Company</th><th>Cycle</th><th>Reservations</th>
                    <th>Outstanding (USD)</th><th>Last Batch</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {CORPORATE_ACCOUNTS.map((a) => (
                    <tr key={a.id}>
                      <td><span className="font-mono text-[10px] text-cyber/80">{a.accountCode}</span></td>
                      <td><span className="text-[11px] text-slate-300">{a.companyName}</span></td>
                      <td><span className="badge badge-gray text-[9px]">{a.billingCycle}</span></td>
                      <td className="font-mono text-slate-400">{a.reservationCount}</td>
                      <td>
                        <span className={`font-mono font-bold text-[12px] ${a.outstandingCents > 0 ? 'text-neon-amber' : 'text-neon-green'}`}>
                          {a.outstandingCents === 0 ? '$0.00 — Clear' : usd(a.outstandingCents)}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-slate-500">{a.lastBatchDate}</td>
                      <td>
                        <span className={`badge text-[9px] ${a.lastBatchStatus === 'Settled' ? 'badge-green' : a.lastBatchStatus === 'Pending' ? 'badge-amber' : 'badge-red'}`}>
                          {a.lastBatchStatus}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn btn-ghost py-1 px-2 text-[9px]">Invoice</button>
                          {a.lastBatchStatus === 'Disputed' && (
                            <button className="btn btn-danger py-1 px-2 text-[9px]">Resolve</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
