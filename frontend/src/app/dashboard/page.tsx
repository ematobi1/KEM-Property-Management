'use client';

import { useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { useDashboardWebSocket } from '@/hooks/useDashboardWebSocket';
import { formatCents } from '@/lib/utils/currency';

export default function DashboardPage() {
  const { metrics, status, lastUpdate, reconnect } = useDashboardWebSocket();

  const loaded = metrics !== null;

  const occupancyPct = metrics
    ? Math.round((metrics.availability.sold / Math.max(metrics.availability.totalRooms, 1)) * 100)
    : 0;

  const hkDirtyPct = metrics
    ? Math.round((metrics.house.dirtyRooms / Math.max(metrics.availability.totalRooms, 1)) * 100)
    : 0;

  const statusDot = status === 'connected' ? 'dot-green' : status === 'reconnecting' ? 'dot-amber' : 'dot-red';
  const statusLabel = status === 'connected' ? 'Live' : status === 'reconnecting' ? 'Reconnecting' : 'Offline';

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle="Overview"
        actions={
          <div className="flex items-center gap-2">
            <span className={`status-dot ${statusDot}`} style={{ width: 6, height: 6 }} />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{statusLabel}</span>
            {status !== 'connected' && (
              <button onClick={reconnect} className="btn btn-ghost py-0.5 px-2 text-[9px]">Reconnect</button>
            )}
            {lastUpdate && (
              <span className="text-[9px] font-mono text-slate-700 hidden sm:block">
                {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            )}
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-6 animate-fade-in">

        {/* ── Section header ────────────────────────────────────────────── */}
        <SectionHeader
          label="HOUSE STATUS"
          tag={`${metrics?.house.inHouse ?? '—'} GUESTS IN-HOUSE`}
          color="cyber"
        />

        {/* ── House metrics ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="In House" value={metrics?.house.inHouse} color="cyber" icon={<PeopleIcon />} loaded={loaded} description="Currently occupied" />
          <MetricCard label="Departures" value={metrics?.house.departures} color="amber" icon={<DepartIcon />} loaded={loaded} description="Checking out today" />
          <MetricCard label="Dirty Rooms" value={metrics?.house.dirtyRooms} color="red" icon={<DirtyIcon />} loaded={loaded} description="Pending housekeeping" />
          <MetricCard label="Ready Rooms" value={metrics?.house.readyRooms} color="green" icon={<ReadyIcon />} loaded={loaded} description="Available for check-in" />
        </div>

        {/* ── Occupancy bar ─────────────────────────────────────────────── */}
        {loaded && metrics && (
          <div className="card-cyber rounded-sm p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Occupancy Rate</span>
              <span className="text-lg font-mono font-bold text-cyber glow-cyber">{occupancyPct}%</span>
            </div>
            <div className="flex gap-1 h-2">
              <div className="h-full rounded-sm bg-cyber/80 transition-all duration-1000" style={{ width: `${(metrics.availability.sold / Math.max(metrics.availability.totalRooms, 1)) * 100}%` }} title={`Sold: ${metrics.availability.sold}`} />
              <div className="h-full rounded-sm bg-neon-amber/60" style={{ width: `${(metrics.house.dirtyRooms / Math.max(metrics.availability.totalRooms, 1)) * 100}%` }} title={`Dirty: ${metrics.house.dirtyRooms}`} />
              <div className="h-full rounded-sm bg-slate-700" style={{ width: `${(metrics.availability.outOfOrder / Math.max(metrics.availability.totalRooms, 1)) * 100}%` }} title={`OOO: ${metrics.availability.outOfOrder}`} />
              <div className="h-full rounded-sm bg-neon-green/20 flex-1" />
            </div>
            <div className="flex gap-4 mt-2">
              {[
                { label: 'Sold', color: 'bg-cyber/80', value: metrics.availability.sold },
                { label: 'Dirty', color: 'bg-neon-amber/60', value: metrics.house.dirtyRooms },
                { label: 'Out of Order', color: 'bg-slate-700', value: metrics.availability.outOfOrder },
                { label: 'Available', color: 'bg-neon-green/20', value: metrics.availability.available },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-sm ${item.color}`} />
                  <span className="text-[10px] font-mono text-slate-500">{item.label} <span className="text-slate-400">{item.value}</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── KPIs ─────────────────────────────────────────────────────── */}
        <SectionHeader label="KEY PERFORMANCE INDICATORS" color="purple" />
        <div className="grid grid-cols-3 gap-3">
          <div className="card-cyber rounded-sm p-4 text-center">
            <p className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-2">Occupancy</p>
            <p className="text-3xl font-mono font-bold text-cyber glow-cyber">{loaded ? `${occupancyPct}%` : '—'}</p>
            <p className="text-[10px] text-slate-600 mt-1">{loaded ? `${metrics?.availability.sold ?? 0} / ${metrics?.availability.totalRooms ?? 0} rooms` : ''}</p>
          </div>
          <div className="card-cyber rounded-sm p-4 text-center">
            <p className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-2">ADR</p>
            <p className="text-3xl font-mono font-bold text-neon-green">—</p>
            <p className="text-[10px] text-slate-600 mt-1">Requires nightly snapshot</p>
          </div>
          <div className="card-cyber rounded-sm p-4 text-center">
            <p className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-2">RevPAR</p>
            <p className="text-3xl font-mono font-bold text-neon-purple">—</p>
            <p className="text-[10px] text-slate-600 mt-1">Requires nightly snapshot</p>
          </div>
        </div>

        {/* ── Bookings & Availability ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <SectionHeader label="BOOKINGS" color="purple" />
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Arrivals Today" value={metrics?.bookings.arrivals} color="green" icon={<ArrowUpIcon />} loaded={loaded} description="Expected today" />
              <MetricCard label="No Show / Cancel" value={metrics?.bookings.noShowOrLateCancel} color="red" icon={<NoShowIcon />} loaded={loaded} description="Late cancellations" />
              <MetricCard label="Advance Deposits" value={metrics?.bookings.advanceDepositsPaid} color="amber" icon={<DepositIcon />} loaded={loaded} description="Paid deposits" />
              <MetricCard label="Booked Today" value={metrics?.bookings.bookedToday} color="purple" icon={<BookIcon />} loaded={loaded} description="New reservations" />
            </div>
          </div>

          <div className="space-y-3">
            <SectionHeader label="AVAILABILITY" color="green" />
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Total Rooms" value={metrics?.availability.totalRooms} color="cyber" icon={<RoomsIcon />} loaded={loaded} description="Property inventory" />
              <MetricCard label="Out of Order" value={metrics?.availability.outOfOrder} color="red" icon={<OOOIcon />} loaded={loaded} description="Unavailable" />
              <MetricCard label="Sold" value={metrics?.availability.sold} color="amber" icon={<SoldIcon />} loaded={loaded} description="Currently occupied" />
              <MetricCard label="Available" value={metrics?.availability.available} color="green" icon={<AvailableIcon />} loaded={loaded} description="Open for booking" />
            </div>
          </div>
        </div>

        {/* ── Quick stats ring ─────────────────────────────────────────── */}
        {loaded && metrics && (
          <div className="grid grid-cols-3 gap-3 animate-slide-up">
            <StatRing label="Housekeeping" value={hkDirtyPct} color="#FF4757" subLabel={`${metrics.house.dirtyRooms} dirty rooms`} />
            <StatRing label="Check-In Ready" value={Math.round((metrics.house.readyRooms / Math.max(metrics.availability.totalRooms, 1)) * 100)} color="#00E5A0" subLabel={`${metrics.house.readyRooms} rooms ready`} />
            <StatRing label="Deposit Collected" value={Math.round((metrics.bookings.advanceDepositsPaid / Math.max(metrics.bookings.arrivals, 1)) * 100)} color="#00CFFF" subLabel={`${metrics.bookings.advanceDepositsPaid} of ${metrics.bookings.arrivals}`} />
          </div>
        )}

        {/* ── Night Audit ───────────────────────────────────────────────── */}
        <SectionHeader label="NIGHT AUDIT" color="amber" tag="AUTOMATED ENGINE" />
        <NightAuditWidget />

        {/* ── Automation Engine ─────────────────────────────────────────── */}
        <SectionHeader label="AUTOMATION ENGINE" color="purple" tag="EXTENSIONS" />
        <ExtensionsWidget />

      </main>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label, tag, color }: { label: string; tag?: string; color: string }) {
  const accent: Record<string, string> = {
    cyber:  'border-cyber/40 text-cyber bg-cyber/5',
    purple: 'border-neon-purple/40 text-neon-purple bg-neon-purple/5',
    green:  'border-neon-green/40 text-neon-green bg-neon-green/5',
    amber:  'border-neon-amber/40 text-neon-amber bg-neon-amber/5',
  };
  const line: Record<string, string> = {
    cyber: 'bg-cyber/50', purple: 'bg-neon-purple/50', green: 'bg-neon-green/50', amber: 'bg-neon-amber/50',
  };
  return (
    <div className="flex items-center gap-3">
      <div className={`w-1 h-4 rounded-full ${line[color] ?? 'bg-cyber/50'}`} />
      <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-slate-500 uppercase">{label}</span>
      {tag && (
        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm border ${accent[color] ?? accent['cyber']}`}>
          {tag}
        </span>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number | undefined;
  color: string;
  icon: React.ReactNode;
  loaded: boolean;
  description: string;
}

const colorMap: Record<string, { num: string; icon: string; glow: string }> = {
  cyber:  { num: 'text-cyber',       icon: 'text-cyber/60',       glow: 'hover:shadow-cyber' },
  green:  { num: 'text-neon-green',  icon: 'text-neon-green/60',  glow: 'hover:shadow-neon-green' },
  amber:  { num: 'text-neon-amber',  icon: 'text-neon-amber/60',  glow: 'hover:shadow-neon-amber' },
  red:    { num: 'text-neon-red',    icon: 'text-neon-red/60',    glow: 'hover:shadow-neon-red' },
  purple: { num: 'text-neon-purple', icon: 'text-neon-purple/60', glow: 'hover:shadow-neon-purple' },
};

function MetricCard({ label, value, color, icon, loaded, description }: MetricCardProps) {
  const c = colorMap[color] ?? colorMap['cyber']!;
  return (
    <div className={`card-cyber rounded-sm p-4 brackets transition-shadow duration-200 ${c.glow}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`${c.icon}`}>{icon}</div>
      </div>
      <div className={`text-3xl font-mono font-bold leading-none mb-1 ${c.num} font-numeric transition-all duration-700`}>
        {!loaded ? (
          <span className="inline-block w-12 h-8 rounded shimmer" />
        ) : (
          <span className="animate-count-up">{value ?? '—'}</span>
        )}
      </div>
      <p className="text-[11px] font-semibold text-slate-300 mt-2">{label}</p>
      <p className="text-[10px] text-slate-600 mt-0.5">{description}</p>
    </div>
  );
}

function StatRing({ label, value, color, subLabel }: { label: string; value: number; color: string; subLabel: string }) {
  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="card-cyber rounded-sm p-4 flex items-center gap-4">
      <div className="relative flex-shrink-0">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
          <circle cx="36" cy="36" r="30" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 36 36)"
            style={{ filter: `drop-shadow(0 0 6px ${color}80)`, transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-mono font-bold" style={{ color }}>{value}%</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-300">{label}</p>
        <p className="text-[10px] font-mono text-slate-600 mt-0.5">{subLabel}</p>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = (d: string) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={d} /></svg>
);
const PeopleIcon   = () => I('M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75');
const DepartIcon   = () => I('M5 12h14M12 5l7 7-7 7');
const DirtyIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M9.5 15s1 1.5 2.5 1.5 2.5-1.5 2.5-1.5"/></svg>;
const ReadyIcon    = () => I('M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3');
const ArrowUpIcon  = () => I('M12 19V5M5 12l7-7 7 7');
const NoShowIcon   = () => I('M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01');
const DepositIcon  = () => I('M12 1v22M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6');
const BookIcon     = () => I('M16 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8l-5-5zM14 3v5h5M12 13v4M10 15h4');
const RoomsIcon    = () => I('M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10');
const OOOIcon      = () => I('M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z');
const SoldIcon     = () => I('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z');
const AvailableIcon= () => I('M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3');

// ─── Night Audit Widget ───────────────────────────────────────────────────────
const AUDIT_LOG = [
  { date: '2026-06-16', time: '03:02 UTC', status: 'Success', folios: 84, discrepancies: 0, duration: '4m 12s' },
  { date: '2026-06-15', time: '03:01 UTC', status: 'Success', folios: 81, discrepancies: 1, duration: '3m 58s' },
  { date: '2026-06-14', time: '03:04 UTC', status: 'Success', folios: 79, discrepancies: 0, duration: '4m 07s' },
];

function NightAuditWidget() {
  const [triggering, setTriggering] = useState(false);
  const [triggered, setTriggered]   = useState(false);

  async function runAudit() {
    setTriggering(true);
    await new Promise((r) => setTimeout(r, 1800));
    setTriggering(false);
    setTriggered(true);
    setTimeout(() => setTriggered(false), 4000);
  }

  const last = AUDIT_LOG[0]!;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="card-cyber rounded-sm p-5 brackets col-span-1">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest">Engine Status</p>
          <div className="flex items-center gap-1.5">
            <span className="status-dot dot-green" style={{ width: 6, height: 6 }} />
            <span className="text-[10px] font-mono text-neon-green">Online</span>
          </div>
        </div>
        <div className="space-y-2 text-[11px] font-mono mb-4">
          {[
            { label: 'Schedule', value: '03:00 UTC daily', cls: 'text-slate-300' },
            { label: 'Last Run', value: `${last.date} · ${last.time}`, cls: 'text-neon-green' },
            { label: 'Duration', value: last.duration, cls: 'text-slate-300' },
            { label: 'Folios',   value: String(last.folios), cls: 'text-cyber' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="flex justify-between">
              <span className="text-slate-600">{label}</span>
              <span className={cls}>{value}</span>
            </div>
          ))}
          <div className="flex justify-between">
            <span className="text-slate-600">Discrepancies</span>
            <span className={last.discrepancies > 0 ? 'text-neon-red' : 'text-neon-green'}>
              {last.discrepancies === 0 ? '0 — Clean' : last.discrepancies}
            </span>
          </div>
        </div>
        {triggered ? (
          <div className="flex items-center gap-2 p-2 rounded-sm bg-neon-green/8 border border-neon-green/20">
            <span className="status-dot dot-green" style={{ width: 6, height: 6 }} />
            <span className="text-[10px] font-mono text-neon-green">Audit queued</span>
          </div>
        ) : (
          <button onClick={runAudit} disabled={triggering} className="btn btn-cyber w-full justify-center text-[11px]">
            {triggering ? (<><svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Running…</>) : (<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run Now</>)}
          </button>
        )}
      </div>

      <div className="card-cyber rounded-sm p-5 col-span-2">
        <p className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-3">Recent Audit Runs</p>
        <table className="pms-table">
          <thead><tr><th>Date</th><th>Time</th><th>Status</th><th>Folios</th><th>Discrepancies</th><th>Duration</th><th>Report</th></tr></thead>
          <tbody>
            {AUDIT_LOG.map((run) => (
              <tr key={run.date}>
                <td className="font-mono text-[11px] text-slate-400">{run.date}</td>
                <td className="font-mono text-[11px] text-slate-500">{run.time}</td>
                <td><span className="badge badge-green text-[9px]">{run.status}</span></td>
                <td className="font-mono text-[11px] text-cyber">{run.folios}</td>
                <td><span className={`font-mono text-[11px] ${run.discrepancies > 0 ? 'text-neon-red' : 'text-neon-green'}`}>{run.discrepancies === 0 ? '0' : run.discrepancies}</span></td>
                <td className="font-mono text-[11px] text-slate-500">{run.duration}</td>
                <td><button className="btn btn-ghost py-0.5 px-2 text-[9px]"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Extensions Widget ────────────────────────────────────────────────────────
const DASH_AGENTS = [
  { name: 'Night Audit Engine',     status: 'Active' as const, skills: 3, color: 'text-neon-green',  dot: 'dot-green' },
  { name: 'Deposit Validator',      status: 'Active' as const, skills: 1, color: 'text-neon-green',  dot: 'dot-green' },
  { name: 'Webhook Dispatcher',     status: 'Active' as const, skills: 4, color: 'text-neon-green',  dot: 'dot-green' },
  { name: 'Housekeeping Optimizer', status: 'Paused' as const, skills: 2, color: 'text-neon-amber',  dot: 'dot-amber' },
  { name: 'No-Show Monitor',        status: 'Active' as const, skills: 1, color: 'text-neon-green',  dot: 'dot-green' },
];
const DASH_HOOKS = [
  { name: 'on-checkin-notify',      event: 'OnCheckIn',           active: true  },
  { name: 'on-checkout-pms-sync',   event: 'OnCheckOut',          active: true  },
  { name: 'on-room-ready-alert',    event: 'OnRoomStatusChange',  active: true  },
  { name: 'on-night-audit-report',  event: 'OnNightAudit',        active: false },
  { name: 'on-reservation-created', event: 'OnReservationCreate', active: true  },
  { name: 'on-no-show-flag',        event: 'OnReservationCancel', active: true  },
];
const DASH_SKILLS = ['night-audit-reconcile', 'deposit-verification', 'room-assignment-optimizer', 'webhook-dispatch', 'no-show-escalation', 'report-generator'];
const DASH_INSTRUCTIONS = [
  { name: 'Global Tone & Safety Policy',      scope: 'Global', active: true  },
  { name: 'Night Audit Reconciliation Rules', scope: 'Agent',  active: true  },
  { name: 'Deposit Block Messaging',          scope: 'Skill',  active: true  },
  { name: 'Webhook Retry Behaviour',          scope: 'Agent',  active: true  },
  { name: 'No-Show Escalation Hold',          scope: 'Agent',  active: false },
  { name: 'Webhook Payload Sanitisation',     scope: 'Hook',   active: true  },
];

function ExtensionsWidget() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="card-cyber rounded-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest">Agents</p>
          <span className="badge badge-green text-[9px]">{DASH_AGENTS.filter((a) => a.status === 'Active').length} Active</span>
        </div>
        <div className="space-y-2">
          {DASH_AGENTS.map((agent) => (
            <div key={agent.name} className="flex items-center gap-2.5">
              <span className={`status-dot ${agent.dot} flex-shrink-0`} style={{ width: 6, height: 6 }} />
              <span className="text-[11px] text-slate-400 flex-1 truncate">{agent.name}</span>
              <span className={`text-[9px] font-mono ${agent.color}`}>{agent.status}</span>
              <span className="text-[9px] font-mono text-slate-700">{agent.skills} skills</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-cyber rounded-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest">Hooks</p>
          <span className="badge badge-cyan text-[9px]">{DASH_HOOKS.filter((h) => h.active).length}/{DASH_HOOKS.length} Active</span>
        </div>
        <div className="space-y-2">
          {DASH_HOOKS.map((hook) => (
            <div key={hook.name} className="flex items-center gap-2.5">
              <span className={`status-dot ${hook.active ? 'dot-green' : 'dot-gray'} flex-shrink-0`} style={{ width: 6, height: 6 }} />
              <span className="font-mono text-[10px] text-cyber/70 flex-1 truncate">{hook.name}</span>
              <span className="text-[9px] font-mono text-slate-700 truncate max-w-24">{hook.event}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-cyber rounded-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest">Skills</p>
          <span className="badge badge-green text-[9px]">{DASH_SKILLS.length} Registered</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DASH_SKILLS.map((skill) => (
            <span key={skill} className="text-[9px] font-mono bg-neon-green/5 border border-neon-green/15 text-neon-green/70 px-2 py-0.5 rounded-sm">{skill}</span>
          ))}
        </div>
      </div>

      <div className="card-cyber rounded-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest">Instructions</p>
          <span className="badge badge-amber text-[9px]">{DASH_INSTRUCTIONS.filter((i) => i.active).length}/{DASH_INSTRUCTIONS.length} Active</span>
        </div>
        <div className="space-y-2">
          {DASH_INSTRUCTIONS.map((inst) => {
            const scopeColor: Record<string, string> = { Global: 'text-neon-amber', Agent: 'text-neon-purple', Skill: 'text-neon-green', Hook: 'text-cyber' };
            return (
              <div key={inst.name} className="flex items-center gap-2.5">
                <span className={`status-dot ${inst.active ? 'dot-green' : 'dot-gray'} flex-shrink-0`} style={{ width: 6, height: 6 }} />
                <span className="text-[11px] text-slate-400 flex-1 truncate">{inst.name}</span>
                <span className={`text-[9px] font-mono ${scopeColor[inst.scope] ?? 'text-slate-600'}`}>{inst.scope}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
