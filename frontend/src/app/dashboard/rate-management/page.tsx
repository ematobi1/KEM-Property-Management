'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import CurrencyInput from '@/components/CurrencyInput';
import { formatCents } from '@/lib/utils/currency';
import { createRatePlan, getRatePlans, getBestAvailableRate, triggerRateRecalculation } from '@/lib/api/rates';
import type { RatePlan, BARResult, CreateRatePlanInput, DayWeights } from '@/lib/api/types';
import { ApiError } from '@/lib/api/client';

const ROOM_TYPES = ['Standard', 'King', 'Queen', 'Suite'];
const DAYS: Array<{ key: keyof DayWeights; label: string }> = [
  { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' }, { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' }, { key: 'fri', label: 'Fri' }, { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

const DEFAULT_WEIGHTS: DayWeights = { mon: 1, tue: 1, wed: 1, thu: 1, fri: 1, sat: 1.2, sun: 1.1 };

function getUserRole(): string {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('pms_session') : null;
    if (!raw) return '';
    return (JSON.parse(raw) as { user: { role: string } }).user.role;
  } catch { return ''; }
}

export default function RateManagementPage() {
  const [plans, setPlans] = useState<RatePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateRatePlanInput>({
    roomType: 'Standard',
    dateStart: '',
    dateEnd: '',
    baseRateCents: 0,
    demandMultiplier: 1.0,
    seasonalityFactor: 1.0,
    dayOfWeekWeights: { ...DEFAULT_WEIGHTS },
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [barRoomType, setBarRoomType] = useState('Standard');
  const [barDate, setBarDate] = useState('');
  const [barResult, setBarResult] = useState<BARResult | null>(null);
  const [barLoading, setBarLoading] = useState(false);
  const [barError, setBarError] = useState<string | null>(null);

  const [recalculating, setRecalculating] = useState(false);
  const [recalcConfirm, setRecalcConfirm] = useState(false);

  const userRole = getUserRole();
  const isAdmin = userRole === 'Admin';

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRatePlans();
      setPlans(Array.isArray(data) ? data : (data as { data: RatePlan[] }).data ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load rate plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchPlans(); }, [fetchPlans]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.dateStart || !form.dateEnd) { setFormError('Date range is required'); return; }
    if (form.baseRateCents < 100) { setFormError('Base rate must be at least $1.00'); return; }
    if (new Date(form.dateEnd) <= new Date(form.dateStart)) { setFormError('End date must be after start date'); return; }
    setSubmitting(true);
    setFormError(null);
    try {
      await createRatePlan(form);
      await fetchPlans();
      setForm({ roomType: 'Standard', dateStart: '', dateEnd: '', baseRateCents: 0, demandMultiplier: 1.0, seasonalityFactor: 1.0, dayOfWeekWeights: { ...DEFAULT_WEIGHTS } });
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Failed to create rate plan');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBARLookup() {
    if (!barDate) { setBarError('Select a date'); return; }
    setBarLoading(true);
    setBarError(null);
    setBarResult(null);
    try {
      const result = await getBestAvailableRate(barRoomType, new Date(barDate).toISOString());
      setBarResult(result);
    } catch (e) {
      setBarError(e instanceof ApiError ? e.message : 'No rate plan found for this date');
    } finally {
      setBarLoading(false);
    }
  }

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      await triggerRateRecalculation();
      setRecalcConfirm(false);
      await fetchPlans();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Recalculation failed');
    } finally {
      setRecalculating(false);
    }
  }

  function setDayWeight(key: keyof DayWeights, val: number) {
    setForm((f) => ({ ...f, dayOfWeekWeights: { ...f.dayOfWeekWeights, [key]: val } }));
  }

  return (
    <>
      <TopBar title="Rate Management" subtitle="Dynamic Pricing" />

      <main className="flex-1 overflow-y-auto p-6 space-y-6 animate-fade-in">

        {/* ── Active Rate Plans ─────────────────────────────────────────── */}
        <section className="card-cyber rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Active Rate Plans</p>
            <button onClick={fetchPlans} className="btn btn-ghost text-[10px]">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
              Refresh
            </button>
          </div>

          {error && <div className="text-neon-red text-xs font-mono mb-3">{error}</div>}

          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 rounded shimmer" />)}</div>
          ) : plans.length === 0 ? (
            <p className="text-slate-600 text-xs font-mono py-8 text-center">No active rate plans</p>
          ) : (
            <table className="pms-table">
              <thead><tr>
                <th>Room Type</th><th>Date Start</th><th>Date End</th>
                <th>Base Rate</th><th>Demand ×</th><th>Seasonality ×</th>
              </tr></thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id}>
                    <td><span className="badge badge-cyan text-[9px]">{p.roomType}</span></td>
                    <td className="font-mono text-[11px] text-slate-400">{new Date(p.dateStart).toLocaleDateString()}</td>
                    <td className="font-mono text-[11px] text-slate-400">{new Date(p.dateEnd).toLocaleDateString()}</td>
                    <td className="font-mono text-[12px] text-neon-green">{formatCents(p.baseRateCents)}</td>
                    <td className="font-mono text-[11px] text-neon-amber">{p.demandMultiplier.toFixed(2)}×</td>
                    <td className="font-mono text-[11px] text-neon-purple">{p.seasonalityFactor.toFixed(2)}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* ── Create Rate Plan ──────────────────────────────────────────── */}
        <section className="card-cyber rounded-sm p-5">
          <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-4">Create Rate Plan</p>

          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-sm bg-neon-red/5 border border-neon-red/20 mb-4">
              <span className="text-xs text-neon-red">{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Room Type</label>
                <select
                  value={form.roomType}
                  onChange={(e) => setForm((f) => ({ ...f, roomType: e.target.value }))}
                  className="pms-input text-xs"
                >
                  {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Base Rate</label>
                <CurrencyInput
                  value={form.baseRateCents}
                  onChange={(c) => setForm((f) => ({ ...f, baseRateCents: c }))}
                  placeholder="150.00"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Date Start</label>
                <input
                  type="date"
                  value={form.dateStart ? form.dateStart.split('T')[0] : ''}
                  onChange={(e) => setForm((f) => ({ ...f, dateStart: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                  className="pms-input text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Date End</label>
                <input
                  type="date"
                  value={form.dateEnd ? form.dateEnd.split('T')[0] : ''}
                  onChange={(e) => setForm((f) => ({ ...f, dateEnd: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                  className="pms-input text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Demand Multiplier</label>
                <input
                  type="number"
                  min="0.1" max="5.0" step="0.1"
                  value={form.demandMultiplier}
                  onChange={(e) => setForm((f) => ({ ...f, demandMultiplier: parseFloat(e.target.value) || 1 }))}
                  className="pms-input text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Seasonality Factor</label>
                <input
                  type="number"
                  min="0.1" max="5.0" step="0.1"
                  value={form.seasonalityFactor}
                  onChange={(e) => setForm((f) => ({ ...f, seasonalityFactor: parseFloat(e.target.value) || 1 }))}
                  className="pms-input text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-2">Day-of-Week Weights</label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map(({ key, label }) => (
                  <div key={key} className="text-center">
                    <p className="text-[9px] font-mono text-slate-600 mb-1">{label}</p>
                    <input
                      type="number"
                      min="0.1" max="5.0" step="0.1"
                      value={form.dayOfWeekWeights[key]}
                      onChange={(e) => setDayWeight(key, parseFloat(e.target.value) || 1)}
                      className="pms-input text-[11px] font-mono text-center px-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn btn-cyber w-full justify-center">
              {submitting ? 'Creating…' : 'Create Rate Plan'}
            </button>
          </form>
        </section>

        {/* ── BAR Lookup ────────────────────────────────────────────────── */}
        <section className="card-cyber rounded-sm p-5">
          <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-4">Best Available Rate Lookup</p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Room Type</label>
              <select value={barRoomType} onChange={(e) => setBarRoomType(e.target.value)} className="pms-input text-xs">
                {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Date</label>
              <input
                type="date"
                value={barDate}
                onChange={(e) => setBarDate(e.target.value)}
                className="pms-input text-xs font-mono"
              />
            </div>
            <button onClick={handleBARLookup} disabled={barLoading} className="btn btn-solid-cyber flex-shrink-0">
              {barLoading ? 'Looking up…' : 'Get Rate'}
            </button>
          </div>

          {barError && <p className="text-neon-red text-xs font-mono mt-3">{barError}</p>}

          {barResult && (
            <div className="mt-4 p-4 bg-space-800 rounded-sm border border-cyber/15">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Base Rate</p>
                  <p className="text-xl font-mono font-bold text-slate-300">{formatCents(barResult.baseRateCents)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Applied Multipliers</p>
                  <p className="text-xl font-mono font-bold text-neon-amber">
                    {(barResult.finalRateCents / Math.max(barResult.baseRateCents, 1)).toFixed(2)}×
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Final Rate</p>
                  <p className="text-2xl font-mono font-bold text-cyber glow-cyber">{formatCents(barResult.finalRateCents)}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Recalculate (admin only) ──────────────────────────────────── */}
        {isAdmin && (
          <section className="card-cyber rounded-sm p-5">
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-3">System Recalculation</p>
            <p className="text-xs text-slate-500 mb-4">Recompute demand multipliers for all active rate plans based on current occupancy. This may affect live rates.</p>

            {!recalcConfirm ? (
              <button onClick={() => setRecalcConfirm(true)} className="btn btn-danger">
                Trigger Recalculation
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-xs text-neon-amber">Confirm: recalculate all active rate plans now?</p>
                <button onClick={handleRecalculate} disabled={recalculating} className="btn btn-danger">
                  {recalculating ? 'Running…' : 'Confirm'}
                </button>
                <button onClick={() => setRecalcConfirm(false)} className="btn btn-ghost">Cancel</button>
              </div>
            )}
          </section>
        )}

      </main>
    </>
  );
}
