'use client';

import { useState } from 'react';
import TopBar from '@/components/layout/TopBar';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'channels' | 'wallets' | 'vouchers' | 'identity';

type ChannelName = 'Platform A' | 'Platform B' | 'Platform C';
type WalletProvider = 'Wallet Provider A' | 'Wallet Provider B';
type VoucherIssuer = 'Platform A' | 'Platform B' | 'Platform C' | 'Direct';

interface ChannelAllocation {
  channel: ChannelName;
  totalAllotment: number;
  sold: number;
  held: number;
  available: number;
  lastSyncAt: string;
  syncStatus: 'Synced' | 'Stale' | 'Error';
  roomTypes: { type: string; allotment: number; sold: number }[];
}

interface WalletTransaction {
  id: string;
  guestName: string;
  roomNumber: string | null;
  provider: WalletProvider;
  amountCents: number;
  description: string;
  transactionRef: string;
  status: 'Settled' | 'Pending' | 'Refunded' | 'Failed';
  timestamp: string;
}

interface Voucher {
  id: string;
  code: string;
  guestName: string;
  roomNumber: string | null;
  type: 'Discount' | 'F&B Credit' | 'Upgrade' | 'Complimentary Night';
  valueCents: number;
  issuedBy: VoucherIssuer;
  status: 'Redeemed' | 'Pending' | 'Expired' | 'Invalid';
  redeemedAt: string | null;
  expiresAt: string;
}

interface IdentityRecord {
  id: string;
  guestName: string;
  roomNumber: string;
  documentType: 'Passport' | 'National ID' | 'Residence Permit';
  documentNumber: string;
  idHash: string;
  ocrStatus: 'Verified' | 'Pending' | 'Failed' | 'Manual Review';
  complianceSyncStatus: 'Synced' | 'Pending' | 'Failed';
  complianceRef: string | null;
  checkInDate: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CHANNELS: ChannelAllocation[] = [
  {
    channel: 'Platform A', totalAllotment: 30, sold: 22, held: 3, available: 5,
    lastSyncAt: '2026-06-16 14:32 UTC', syncStatus: 'Synced',
    roomTypes: [{ type: 'Standard', allotment: 15, sold: 11 }, { type: 'King', allotment: 8, sold: 7 }, { type: 'Suite', allotment: 7, sold: 4 }],
  },
  {
    channel: 'Platform B', totalAllotment: 20, sold: 14, held: 2, available: 4,
    lastSyncAt: '2026-06-16 14:28 UTC', syncStatus: 'Synced',
    roomTypes: [{ type: 'Standard', allotment: 12, sold: 9 }, { type: 'Queen', allotment: 8, sold: 5 }],
  },
  {
    channel: 'Platform C', totalAllotment: 15, sold: 8, held: 0, available: 7,
    lastSyncAt: '2026-06-16 13:50 UTC', syncStatus: 'Stale',
    roomTypes: [{ type: 'Standard', allotment: 10, sold: 5 }, { type: 'King', allotment: 5, sold: 3 }],
  },
];

const WALLET_TRANSACTIONS: WalletTransaction[] = [
  { id: 'wt1', guestName: 'W***g L***i', roomNumber: '201', provider: 'Wallet Provider A', amountCents: 12800, description: 'Room Charge — Night 1',   transactionRef: 'WPA20260616-001A', status: 'Settled',  timestamp: '2026-06-16 12:01' },
  { id: 'wt2', guestName: 'Z***g W***i', roomNumber: '305', provider: 'Wallet Provider B', amountCents: 8600,  description: 'F&B — Restaurant Dinner', transactionRef: 'WPB20260616-022B', status: 'Settled',  timestamp: '2026-06-16 19:44' },
  { id: 'wt3', guestName: 'L***i F***g', roomNumber: '112', provider: 'Wallet Provider A', amountCents: 36000, description: 'Room Charge — 3 Nights',  transactionRef: 'WPA20260615-007C', status: 'Settled',  timestamp: '2026-06-15 11:20' },
  { id: 'wt4', guestName: 'C***n X***o', roomNumber: '418', provider: 'Wallet Provider B', amountCents: 4200,  description: 'Spa Treatment — 60min',   transactionRef: 'WPB20260616-035D', status: 'Pending',  timestamp: '2026-06-16 15:30' },
  { id: 'wt5', guestName: 'Y***g M***g', roomNumber: '223', provider: 'Wallet Provider A', amountCents: 21000, description: 'Room Charge — Night 1',   transactionRef: 'WPA20260616-012E', status: 'Settled',  timestamp: '2026-06-16 10:05' },
  { id: 'wt6', guestName: 'H***g J***n', roomNumber: '321', provider: 'Wallet Provider B', amountCents: 3500,  description: 'Mini Bar Settlement',     transactionRef: 'WPB20260616-041F', status: 'Settled',  timestamp: '2026-06-16 08:15' },
  { id: 'wt7', guestName: 'W***g L***i', roomNumber: '201', provider: 'Wallet Provider A', amountCents: 2800,  description: 'Deposit Refund',          transactionRef: 'WPA20260616-RFD1', status: 'Refunded', timestamp: '2026-06-16 17:00' },
  { id: 'wt8', guestName: 'L***u Y***g', roomNumber: null,  provider: 'Wallet Provider B', amountCents: 9600,  description: 'Pre-payment — Walk-In',   transactionRef: 'WPB20260616-ERR0', status: 'Failed',   timestamp: '2026-06-16 18:22' },
];

const VOUCHERS: Voucher[] = [
  { id: 'v1', code: 'PLA-2026-8821', guestName: 'W***g L***i', roomNumber: '201', type: 'Discount',            valueCents: 2000,  issuedBy: 'Platform A', status: 'Redeemed', redeemedAt: '2026-06-16', expiresAt: '2026-06-30' },
  { id: 'v2', code: 'PLB-2026-4432', guestName: 'Z***g W***i', roomNumber: '305', type: 'F&B Credit',          valueCents: 1500,  issuedBy: 'Platform B', status: 'Pending',  redeemedAt: null,         expiresAt: '2026-06-18' },
  { id: 'v3', code: 'PLC-2026-9901', guestName: 'L***i F***g', roomNumber: '112', type: 'Upgrade',             valueCents: 0,     issuedBy: 'Platform C', status: 'Redeemed', redeemedAt: '2026-06-15', expiresAt: '2026-06-20' },
  { id: 'v4', code: 'PLA-2026-1155', guestName: 'C***n X***o', roomNumber: '418', type: 'Discount',            valueCents: 1000,  issuedBy: 'Platform A', status: 'Pending',  redeemedAt: null,         expiresAt: '2026-06-16' },
  { id: 'v5', code: 'DIR-2026-0072', guestName: 'Y***g M***g', roomNumber: '223', type: 'Complimentary Night', valueCents: 12800, issuedBy: 'Direct',    status: 'Redeemed', redeemedAt: '2026-06-16', expiresAt: '2026-06-16' },
  { id: 'v6', code: 'PLB-2026-7733', guestName: 'H***g J***n', roomNumber: null,  type: 'Discount',            valueCents: 800,   issuedBy: 'Platform B', status: 'Expired',  redeemedAt: null,         expiresAt: '2026-06-14' },
];

const IDENTITY_RECORDS: IdentityRecord[] = [
  { id: 'ir1', guestName: 'W***g L***i', roomNumber: '201', documentType: 'National ID',      documentNumber: '310***5892',  idHash: 'a3f8c2...e91b', ocrStatus: 'Verified',      complianceSyncStatus: 'Synced',  complianceRef: 'CMP-REG-2026-88821', checkInDate: '2026-06-16' },
  { id: 'ir2', guestName: 'Z***g W***i', roomNumber: '305', documentType: 'Passport',         documentNumber: 'EA***4821',   idHash: 'b7d1a4...f23c', ocrStatus: 'Verified',      complianceSyncStatus: 'Synced',  complianceRef: 'CMP-REG-2026-44392', checkInDate: '2026-06-15' },
  { id: 'ir3', guestName: 'L***i F***g', roomNumber: '112', documentType: 'National ID',      documentNumber: '110***1047',  idHash: '2e9c7f...a88d', ocrStatus: 'Verified',      complianceSyncStatus: 'Synced',  complianceRef: 'CMP-REG-2026-12203', checkInDate: '2026-06-16' },
  { id: 'ir4', guestName: 'C***n X***o', roomNumber: '418', documentType: 'Residence Permit', documentNumber: 'RP***29011',  idHash: '—',             ocrStatus: 'Manual Review', complianceSyncStatus: 'Pending', complianceRef: null,                  checkInDate: '2026-06-15' },
  { id: 'ir5', guestName: 'Y***g M***g', roomNumber: '223', documentType: 'National ID',      documentNumber: '440***3314',  idHash: 'f1b8e3...cc19', ocrStatus: 'Verified',      complianceSyncStatus: 'Synced',  complianceRef: 'CMP-REG-2026-99017', checkInDate: '2026-06-16' },
  { id: 'ir6', guestName: 'H***g J***n', roomNumber: '321', documentType: 'Passport',         documentNumber: 'G1***8204',   idHash: '8dc2a1...7e4f', ocrStatus: 'Failed',        complianceSyncStatus: 'Failed',  complianceRef: null,                  checkInDate: '2026-06-13' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function channelBarColor(ch: ChannelName): string {
  if (ch === 'Platform A') return 'bg-cyber';
  if (ch === 'Platform B') return 'bg-neon-amber';
  return 'bg-neon-purple';
}

function channelTextColor(ch: ChannelName): string {
  if (ch === 'Platform A') return 'text-cyber';
  if (ch === 'Platform B') return 'text-neon-amber';
  return 'text-neon-purple';
}

function channelBadge(ch: ChannelName): string {
  if (ch === 'Platform A') return 'badge-cyan';
  if (ch === 'Platform B') return 'badge-amber';
  return 'badge-purple';
}

function channelDot(ch: ChannelName): string {
  if (ch === 'Platform A') return 'dot-cyan';
  if (ch === 'Platform B') return 'dot-amber';
  return 'dot-purple';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChannelsCompliancePage() {
  const [tab, setTab] = useState<Tab>('channels');

  const TABS: { id: Tab; label: string }[] = [
    { id: 'channels', label: 'Channel Manager' },
    { id: 'wallets',  label: 'Digital Wallets' },
    { id: 'vouchers', label: 'Vouchers' },
    { id: 'identity', label: 'ID Compliance' },
  ];

  const totalSettledCents = WALLET_TRANSACTIONS.filter((t) => t.status === 'Settled').reduce((s, t) => s + t.amountCents, 0);
  const pendingWallets    = WALLET_TRANSACTIONS.filter((t) => t.status === 'Pending').length;
  const compliancePending = IDENTITY_RECORDS.filter((r) => r.complianceSyncStatus !== 'Synced').length;

  return (
    <>
      <TopBar
        title="Channels & Compliance"
        subtitle="Distribution Allocation · Digital Wallets · Identity Verification"
        actions={
          <div className="flex gap-2">
            <span className="badge badge-cyan text-[9px]">USD · ISO 4217</span>
            {compliancePending > 0 && <span className="badge badge-amber text-[9px]">{compliancePending} Compliance Pending</span>}
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

        {/* ── Channel Manager ───────────────────────────────────────────── */}
        {tab === 'channels' && (
          <div className="space-y-4">
            <div className="card-cyber rounded-sm p-4 mb-2">
              <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">Direct API Allocation Blocks</p>
              <p className="text-[11px] text-slate-500">Each distribution platform maintains a dedicated allotment block synchronized via direct API. High-concurrency lock-free reservations are serialized per channel to prevent over-allocation.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {CHANNELS.map((ch) => {
                const usedPct = Math.round((ch.sold / ch.totalAllotment) * 100);
                return (
                  <div key={ch.channel} className="card-cyber rounded-sm p-5 brackets">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[13px] font-semibold text-slate-100">{ch.channel}</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`status-dot ${channelDot(ch.channel)}`} style={{ width: 6, height: 6 }} />
                        <span className={`text-[10px] font-mono ${ch.syncStatus === 'Synced' ? 'text-neon-green' : ch.syncStatus === 'Stale' ? 'text-neon-amber' : 'text-neon-red'}`}>{ch.syncStatus}</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-[9px] font-mono mb-1">
                        <span className="text-slate-600">ALLOTMENT</span>
                        <span className={channelTextColor(ch.channel)}>{usedPct}% sold</span>
                      </div>
                      <div className="h-1.5 bg-space-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${channelBarColor(ch.channel)}`} style={{ width: `${usedPct}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                      {[
                        { label: 'Sold',  value: ch.sold,      color: channelTextColor(ch.channel) },
                        { label: 'Held',  value: ch.held,      color: 'text-neon-amber' },
                        { label: 'Avail', value: ch.available, color: 'text-neon-green' },
                      ].map((s) => (
                        <div key={s.label}>
                          <p className={`text-lg font-mono font-bold ${s.color}`}>{s.value}</p>
                          <p className="text-[9px] font-mono text-slate-600">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="cyber-divider mb-2" />
                    <div className="space-y-1">
                      {ch.roomTypes.map((rt) => (
                        <div key={rt.type} className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-slate-600 w-16">{rt.type}</span>
                          <div className="flex-1 h-1 bg-space-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                ch.channel === 'Platform A' ? 'bg-cyber/60' :
                                ch.channel === 'Platform B' ? 'bg-neon-amber/60' : 'bg-neon-purple/60'
                              }`}
                              style={{ width: `${(rt.sold / rt.allotment) * 100}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-slate-600">{rt.sold}/{rt.allotment}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[9px] font-mono text-slate-700 mt-3">Last sync: {ch.lastSyncAt}</p>
                    <button className="btn btn-ghost w-full justify-center text-[10px] mt-2">Force Sync</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Digital Wallets ───────────────────────────────────────────── */}
        {tab === 'wallets' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Settled (USD)', value: usd(totalSettledCents), color: 'text-neon-green' },
                { label: 'Pending',             value: String(pendingWallets), color: 'text-neon-amber' },
                { label: 'Failed',              value: String(WALLET_TRANSACTIONS.filter((t) => t.status === 'Failed').length), color: 'text-neon-red' },
              ].map((s) => (
                <div key={s.label} className="card-cyber rounded-sm p-4 brackets">
                  <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-2">{s.label}</p>
                  <p className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="card-cyber rounded-sm overflow-hidden">
              <table className="pms-table">
                <thead>
                  <tr>
                    <th>Ref</th><th>Guest</th><th>Room</th><th>Provider</th>
                    <th>Amount (USD)</th><th>Description</th><th>Time</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {WALLET_TRANSACTIONS.map((t) => (
                    <tr key={t.id}>
                      <td><span className="font-mono text-[10px] text-cyber/70">{t.transactionRef}</span></td>
                      <td><span className="text-slate-300 text-[11px]">{t.guestName}</span></td>
                      <td>
                        {t.roomNumber
                          ? <span className="font-mono text-[12px] px-2 py-0.5 rounded-sm bg-space-700 border border-cyber/10 text-slate-300">{t.roomNumber}</span>
                          : <span className="text-slate-700 text-[10px]">—</span>}
                      </td>
                      <td>
                        <span className={`badge text-[9px] ${t.provider === 'Wallet Provider A' ? 'badge-green' : 'badge-cyan'}`}>
                          {t.provider}
                        </span>
                      </td>
                      <td>
                        <span className={`font-mono font-bold text-[12px] ${t.status === 'Refunded' ? 'text-neon-amber' : t.status === 'Failed' ? 'text-neon-red' : 'text-slate-200'}`}>
                          {t.status === 'Refunded' ? `(${usd(t.amountCents)})` : usd(t.amountCents)}
                        </span>
                      </td>
                      <td><span className="text-[11px] text-slate-500">{t.description}</span></td>
                      <td className="font-mono text-xs text-slate-500">{t.timestamp}</td>
                      <td>
                        <span className={`badge text-[9px] ${
                          t.status === 'Settled'  ? 'badge-green' :
                          t.status === 'Pending'  ? 'badge-amber' :
                          t.status === 'Refunded' ? 'badge-purple' : 'badge-red'
                        }`}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Vouchers ──────────────────────────────────────────────────── */}
        {tab === 'vouchers' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Redeemed', value: VOUCHERS.filter((v) => v.status === 'Redeemed').length, color: 'text-neon-green' },
                { label: 'Pending',  value: VOUCHERS.filter((v) => v.status === 'Pending').length,  color: 'text-neon-amber' },
                { label: 'Expired',  value: VOUCHERS.filter((v) => v.status === 'Expired').length,  color: 'text-slate-500' },
                { label: 'Invalid',  value: VOUCHERS.filter((v) => v.status === 'Invalid').length,  color: 'text-neon-red' },
              ].map((s) => (
                <div key={s.label} className="card-cyber rounded-sm p-4 brackets">
                  <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-2">{s.label}</p>
                  <p className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="card-cyber rounded-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-cyber/8">
                <div>
                  <p className="text-[11px] font-semibold text-slate-200">Digital Voucher Redemptions</p>
                  <p className="text-[9px] font-mono text-slate-600 mt-0.5">Validates voucher codes against active inventory before applying to folio — real-time redemption workflow</p>
                </div>
              </div>
              <table className="pms-table">
                <thead>
                  <tr>
                    <th>Code</th><th>Guest</th><th>Room</th><th>Type</th>
                    <th>Value (USD)</th><th>Issued By</th><th>Expires</th><th>Redeemed At</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {VOUCHERS.map((v) => (
                    <tr key={v.id}>
                      <td><span className="font-mono text-[10px] text-cyber/80">{v.code}</span></td>
                      <td><span className="text-slate-300 text-[11px]">{v.guestName}</span></td>
                      <td>
                        {v.roomNumber
                          ? <span className="font-mono text-[12px] px-2 py-0.5 rounded-sm bg-space-700 border border-cyber/10 text-slate-300">{v.roomNumber}</span>
                          : <span className="text-slate-700 text-[10px]">—</span>}
                      </td>
                      <td><span className="text-[11px] text-slate-400">{v.type}</span></td>
                      <td>
                        {v.valueCents > 0
                          ? <span className="font-mono font-bold text-neon-green text-[12px]">{usd(v.valueCents)}</span>
                          : <span className="badge badge-purple text-[9px]">Non-monetary</span>}
                      </td>
                      <td>
                        <span className={`badge text-[9px] ${
                          v.issuedBy === 'Platform A' ? 'badge-cyan' :
                          v.issuedBy === 'Platform B' ? 'badge-amber' :
                          v.issuedBy === 'Platform C' ? 'badge-purple' : 'badge-gray'
                        }`}>{v.issuedBy}</span>
                      </td>
                      <td className="font-mono text-xs text-slate-500">{v.expiresAt}</td>
                      <td className="font-mono text-xs text-slate-500">{v.redeemedAt ?? '—'}</td>
                      <td>
                        <span className={`badge text-[9px] ${
                          v.status === 'Redeemed' ? 'badge-green' :
                          v.status === 'Pending'  ? 'badge-amber' :
                          v.status === 'Expired'  ? 'badge-gray'  : 'badge-red'
                        }`}>{v.status}</span>
                      </td>
                      <td>
                        {v.status === 'Pending' && (
                          <button className="btn btn-success py-1 px-2 text-[9px]">Redeem</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ID Compliance ─────────────────────────────────────────────── */}
        {tab === 'identity' && (
          <div className="space-y-4">
            <div className="card-cyber rounded-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FBB040" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <p className="text-[11px] font-semibold text-neon-amber">Real-Time Identity Verification &amp; Compliance Sync</p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Regulatory compliance requires identity verification for all guests within 24 hours of check-in. Document ID numbers are SHA-256 hashed before storage. Scans are stored as encrypted OCR references only. Compliance authority sync must complete within 12 hours or a compliance flag is raised.
              </p>
              <div className="flex gap-4 mt-3 text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="status-dot dot-green" style={{ width: 6, height: 6 }} />
                  <span className="text-slate-500">Verified &amp; Synced: {IDENTITY_RECORDS.filter((r) => r.ocrStatus === 'Verified' && r.complianceSyncStatus === 'Synced').length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="status-dot dot-amber" style={{ width: 6, height: 6 }} />
                  <span className="text-slate-500">Pending Sync: {IDENTITY_RECORDS.filter((r) => r.complianceSyncStatus === 'Pending').length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="status-dot dot-red" style={{ width: 6, height: 6 }} />
                  <span className="text-slate-500">Failed / Review: {IDENTITY_RECORDS.filter((r) => r.ocrStatus === 'Failed' || r.ocrStatus === 'Manual Review').length}</span>
                </div>
              </div>
            </div>

            <div className="card-cyber rounded-sm overflow-hidden">
              <table className="pms-table">
                <thead>
                  <tr>
                    <th>Guest</th><th>Room</th><th>Doc Type</th><th>Doc Number</th>
                    <th>ID Hash (SHA-256)</th><th>OCR Status</th><th>Compliance Sync</th><th>Ref</th><th>Check-In</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {IDENTITY_RECORDS.map((r) => (
                    <tr key={r.id}>
                      <td><span className="text-slate-300 text-[11px]">{r.guestName}</span></td>
                      <td><span className="font-mono text-[12px] px-2 py-0.5 rounded-sm bg-space-700 border border-cyber/10 text-slate-300">{r.roomNumber}</span></td>
                      <td><span className="text-[11px] text-slate-400">{r.documentType}</span></td>
                      <td><span className="font-mono text-[10px] text-slate-500">{r.documentNumber}</span></td>
                      <td>
                        <span className="font-mono text-[9px] text-neon-green/60 bg-neon-green/5 border border-neon-green/10 px-1.5 py-0.5 rounded-sm">
                          {r.idHash}
                        </span>
                      </td>
                      <td>
                        <span className={`badge text-[9px] ${
                          r.ocrStatus === 'Verified'      ? 'badge-green' :
                          r.ocrStatus === 'Pending'       ? 'badge-amber' :
                          r.ocrStatus === 'Manual Review' ? 'badge-purple' : 'badge-red'
                        }`}>{r.ocrStatus}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className={`status-dot ${r.complianceSyncStatus === 'Synced' ? 'dot-green' : r.complianceSyncStatus === 'Pending' ? 'dot-amber' : 'dot-red'}`} style={{ width: 6, height: 6 }} />
                          <span className={`text-[10px] font-mono ${r.complianceSyncStatus === 'Synced' ? 'text-neon-green' : r.complianceSyncStatus === 'Pending' ? 'text-neon-amber' : 'text-neon-red'}`}>
                            {r.complianceSyncStatus}
                          </span>
                        </div>
                      </td>
                      <td>
                        {r.complianceRef
                          ? <span className="font-mono text-[9px] text-slate-500">{r.complianceRef}</span>
                          : <span className="text-slate-700 text-[10px]">—</span>}
                      </td>
                      <td className="font-mono text-xs text-slate-500">{r.checkInDate}</td>
                      <td>
                        <div className="flex gap-1">
                          {(r.ocrStatus === 'Failed' || r.ocrStatus === 'Manual Review') && (
                            <button className="btn btn-danger py-1 px-2 text-[9px]">Review</button>
                          )}
                          {r.complianceSyncStatus === 'Failed' && (
                            <button className="btn btn-cyber py-1 px-2 text-[9px]">Re-sync</button>
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
