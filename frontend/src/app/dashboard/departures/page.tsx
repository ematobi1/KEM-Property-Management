'use client';

import { useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import type { Reservation } from '@/types';
import { MOCK_DEPARTURES } from '@/lib/mock';

export default function DeparturesPage() {
  const [departures, setDepartures] = useState<Reservation[]>(MOCK_DEPARTURES);
  const [processing, setProcessing] = useState<string | null>(null);
  const [folio, setFolio] = useState<Reservation | null>(null);

  async function handleExpressCheckout(r: Reservation) {
    setProcessing(r.id);
    await new Promise((res) => setTimeout(res, 900));
    setDepartures((prev) => prev.filter((d) => d.id !== r.id));
    setProcessing(null);
  }

  return (
    <>
      <TopBar
        title="Departures"
        subtitle="Express Check-Out"
        actions={<span className="badge badge-amber">{departures.length} DEPARTURES</span>}
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-4 animate-fade-in">

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending Checkout', value: departures.length, color: 'text-neon-amber' },
            { label: 'Late Checkout Eligible', value: departures.filter((r) => r.lateCheckOutEligible).length, color: 'text-cyber' },
            { label: 'Checked Out Today', value: MOCK_DEPARTURES.length - departures.length, color: 'text-neon-green' },
          ].map((s) => (
            <div key={s.label} className="card-cyber rounded-sm px-4 py-3 flex items-center gap-3">
              <span className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</span>
              <span className="text-[11px] text-slate-500">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card-cyber rounded-sm overflow-hidden">
          <table className="pms-table">
            <thead>
              <tr>
                <th>Conf. #</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Member Tier</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Late CO</th>
                <th>Deposit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departures.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-neon-green font-mono text-xs py-12">
                    ✓ ALL DEPARTURES COMPLETE
                  </td>
                </tr>
              )}
              {departures.map((r) => {
                const isProcessing = processing === r.id;
                return (
                  <tr key={r.id}>
                    <td><span className="font-mono text-[11px] text-cyber/80">{r.confirmationNumber}</span></td>
                    <td><span className="font-medium">{r.guestLastName}, {r.guestFirstName}</span></td>
                    <td>
                      <span className="font-mono text-[12px] px-2 py-0.5 rounded-sm bg-space-700 border border-cyber/10 text-slate-300">
                        {r.roomNumber}
                      </span>
                    </td>
                    <td><TierBadge tier={r.loyaltyTier} /></td>
                    <td className="font-mono text-xs text-slate-400">{r.checkInDate}</td>
                    <td className="font-mono text-xs text-slate-400">{r.checkOutDate}</td>
                    <td>
                      {r.lateCheckOutEligible ? (
                        <span className="badge badge-cyan">Eligible</span>
                      ) : (
                        <span className="text-slate-700 text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${r.depositStatus === 'Paid' ? 'badge-green' : 'badge-amber'}`}>
                        {r.depositStatus}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setFolio(r)}
                          className="btn btn-ghost py-1 px-2 text-[10px]"
                          title="Print Proforma Folio"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                          </svg>
                          Folio
                        </button>
                        <button
                          onClick={() => handleExpressCheckout(r)}
                          disabled={isProcessing}
                          className="btn btn-danger py-1 px-2 text-[10px]"
                        >
                          {isProcessing ? (
                            <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 12a9 9 0 11-6.219-8.56"/>
                            </svg>
                          ) : (
                            <>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                              </svg>
                              Express CO
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Folio modal */}
        {folio && (
          <FolioModal reservation={folio} onClose={() => setFolio(null)} />
        )}
      </main>
    </>
  );
}

function FolioModal({ reservation: r, onClose }: { reservation: Reservation; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative card-cyber rounded-sm p-6 w-full max-w-md brackets animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Proforma Folio</h2>
            <p className="text-[10px] font-mono text-cyber/60 mt-0.5">PRINT PREVIEW</p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="cyber-divider mb-5" />

        <div className="space-y-3 font-mono text-xs">
          {[
            { label: 'Confirmation', value: r.confirmationNumber },
            { label: 'Guest', value: `${r.guestLastName}, ${r.guestFirstName}` },
            { label: 'Room', value: r.roomNumber ?? '—' },
            { label: 'Member Tier', value: r.loyaltyTier },
            { label: 'Check-In', value: r.checkInDate },
            { label: 'Check-Out', value: r.checkOutDate },
            { label: 'Deposit', value: r.depositStatus },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-cyber/5">
              <span className="text-slate-600">{label}</span>
              <span className="text-slate-300">{value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="btn btn-cyber w-full justify-center mt-5"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
          </svg>
          Send to Print Queue
        </button>
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, string> = { Diamond: 'badge-cyan', Platinum: 'badge-purple', Gold: 'badge-amber', Silver: 'badge-gray', Club: 'badge-gray', None: 'badge-gray' };
  return <span className={`badge ${map[tier] ?? 'badge-gray'}`}>{tier === 'None' ? '—' : tier}</span>;
}
