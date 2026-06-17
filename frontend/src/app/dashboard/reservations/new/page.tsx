'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import type { LoyaltyTier, DepositStatus } from '@/types';
import { MOCK_ROOMS } from '@/lib/mock';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  loyaltyNumber: string;
  loyaltyTier: LoyaltyTier;
  roomType: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  adults: string;
  children: string;
  depositStatus: DepositStatus;
  earlyCheckIn: boolean;
  lateCheckOut: boolean;
  specialRequests: string;
}

const BLANK: FormState = {
  guestFirstName: '',
  guestLastName: '',
  guestEmail: '',
  guestPhone: '',
  loyaltyNumber: '',
  loyaltyTier: 'None',
  roomType: '',
  roomNumber: '',
  checkInDate: '',
  checkOutDate: '',
  adults: '1',
  children: '0',
  depositStatus: 'Future',
  earlyCheckIn: false,
  lateCheckOut: false,
  specialRequests: '',
};

const ROOM_TYPES = ['Standard', 'King', 'Queen', 'Suite'];

const TIER_OPTIONS: { value: LoyaltyTier; label: string; cls: string }[] = [
  { value: 'None',     label: 'None',     cls: 'text-slate-500' },
  { value: 'Club',     label: 'Club',     cls: 'text-slate-400' },
  { value: 'Silver',   label: 'Silver',   cls: 'text-slate-300' },
  { value: 'Gold',     label: 'Gold',     cls: 'text-neon-amber' },
  { value: 'Platinum', label: 'Platinum', cls: 'text-neon-purple' },
  { value: 'Diamond',  label: 'Diamond',  cls: 'text-cyber' },
];

const DEPOSIT_OPTIONS: { value: DepositStatus; label: string; badge: string }[] = [
  { value: 'Future',  label: 'Future',  badge: 'badge-gray' },
  { value: 'Pending', label: 'Pending', badge: 'badge-amber' },
  { value: 'Paid',    label: 'Paid',    badge: 'badge-green' },
];

function generateConfirmationNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'KEM-';
  for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function nightsBetween(ci: string, co: string): number {
  if (!ci || !co) return 0;
  const diff = new Date(co).getTime() - new Date(ci).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewReservationPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(BLANK);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  const availableRooms = useMemo(() => {
    return MOCK_ROOMS.filter(
      (r) => r.availabilityStatus === 'Available' && (!form.roomType || r.roomType === form.roomType)
    );
  }, [form.roomType]);

  const nights = nightsBetween(form.checkInDate, form.checkOutDate);

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.guestFirstName.trim()) e.guestFirstName = 'Required';
    if (!form.guestLastName.trim())  e.guestLastName  = 'Required';
    if (form.guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guestEmail)) e.guestEmail = 'Invalid email';
    if (!form.checkInDate)  e.checkInDate  = 'Required';
    if (!form.checkOutDate) e.checkOutDate = 'Required';
    if (form.checkInDate && form.checkOutDate && nights < 1) e.checkOutDate = 'Must be after check-in';
    if (!form.roomType) e.roomType = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setConfirmed(generateConfirmationNumber());
    setSubmitting(false);
  }

  // ── Success screen ────────────────────────────────────────────────────────

  if (confirmed) {
    return (
      <>
        <TopBar title="New Reservation" subtitle="Booking Confirmed" />
        <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center animate-fade-in">
          <div className="w-full max-w-lg">
            <div className="card-cyber rounded-sm p-8 brackets text-center">
              {/* Success icon */}
              <div className="w-16 h-16 rounded-sm bg-neon-green/10 border border-neon-green/25 flex items-center justify-center mx-auto mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5A0" strokeWidth="1.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>

              <h2 className="text-lg font-semibold text-slate-100 mb-1">Reservation Confirmed</h2>
              <p className="text-[11px] font-mono text-slate-500 mb-6">KEM PROPERTY MANAGEMENT · SYSTEM 1.1</p>

              <div className="inline-block bg-neon-green/6 border border-neon-green/20 rounded-sm px-8 py-4 mb-6">
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">Confirmation Number</p>
                <p className="text-2xl font-mono font-bold text-neon-green tracking-widest">{confirmed}</p>
              </div>

              <div className="cyber-divider mb-5" />

              {/* Summary */}
              <div className="text-left space-y-2 mb-6">
                {[
                  { label: 'Guest',        value: `${form.guestLastName}, ${form.guestFirstName}` },
                  { label: 'Room Type',    value: form.roomType },
                  { label: 'Room',         value: form.roomNumber || 'To be assigned' },
                  { label: 'Check-In',     value: form.checkInDate },
                  { label: 'Check-Out',    value: form.checkOutDate },
                  { label: 'Nights',       value: String(nights) },
                  { label: 'Guests',       value: `${form.adults} adult${parseInt(form.adults) !== 1 ? 's' : ''}${parseInt(form.children) > 0 ? ` · ${form.children} child${parseInt(form.children) !== 1 ? 'ren' : ''}` : ''}` },
                  { label: 'Loyalty Tier', value: form.loyaltyTier },
                  { label: 'Deposit',      value: form.depositStatus },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-1.5 border-b border-cyber/5 font-mono text-xs">
                    <span className="text-slate-600">{label}</span>
                    <span className="text-slate-300">{value}</span>
                  </div>
                ))}
                {(form.earlyCheckIn || form.lateCheckOut) && (
                  <div className="flex justify-between py-1.5 border-b border-cyber/5 font-mono text-xs">
                    <span className="text-slate-600">Preferences</span>
                    <div className="flex gap-1">
                      {form.earlyCheckIn  && <span className="badge badge-purple text-[9px]">ECI</span>}
                      {form.lateCheckOut  && <span className="badge badge-cyan text-[9px]">LCO</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setForm(BLANK); setConfirmed(null); }}
                  className="btn btn-cyber flex-1 justify-center"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  New Reservation
                </button>
                <button
                  onClick={() => router.push('/dashboard/arrivals')}
                  className="btn btn-solid-cyber flex-1 justify-center"
                >
                  View Arrivals
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <>
      <TopBar
        title="New Reservation"
        subtitle="Booking Entry"
        actions={
          <span className="badge badge-cyan text-[9px]">
            {availableRooms.length} ROOMS AVAILABLE
          </span>
        }
      />

      <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-5 items-start">

            {/* ── Left column — form ──────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* Guest Information */}
              <Section title="Guest Information" icon="guest">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First Name" error={errors.guestFirstName} required>
                    <input
                      value={form.guestFirstName}
                      onChange={(e) => set('guestFirstName', e.target.value)}
                      className={`pms-input ${errors.guestFirstName ? 'border-neon-red/50' : ''}`}
                      placeholder="John"
                    />
                  </Field>
                  <Field label="Last Name" error={errors.guestLastName} required>
                    <input
                      value={form.guestLastName}
                      onChange={(e) => set('guestLastName', e.target.value)}
                      className={`pms-input ${errors.guestLastName ? 'border-neon-red/50' : ''}`}
                      placeholder="Smith"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Email" error={errors.guestEmail}>
                    <input
                      type="email"
                      value={form.guestEmail}
                      onChange={(e) => set('guestEmail', e.target.value)}
                      className={`pms-input ${errors.guestEmail ? 'border-neon-red/50' : ''}`}
                      placeholder="guest@email.com"
                    />
                  </Field>
                  <Field label="Phone">
                    <input
                      type="tel"
                      value={form.guestPhone}
                      onChange={(e) => set('guestPhone', e.target.value)}
                      className="pms-input"
                      placeholder="+1 555 000 0000"
                    />
                  </Field>
                </div>
              </Section>

              {/* Membership */}
              <Section title="Membership" icon="member">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Loyalty Number">
                    <input
                      value={form.loyaltyNumber}
                      onChange={(e) => set('loyaltyNumber', e.target.value)}
                      className="pms-input font-mono"
                      placeholder="KEM-000000"
                    />
                  </Field>
                  <Field label="Tier">
                    <select
                      value={form.loyaltyTier}
                      onChange={(e) => set('loyaltyTier', e.target.value as LoyaltyTier)}
                      className="pms-input"
                    >
                      {TIER_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </Section>

              {/* Stay Details */}
              <Section title="Stay Details" icon="stay">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Check-In Date" error={errors.checkInDate} required>
                    <input
                      type="date"
                      value={form.checkInDate}
                      onChange={(e) => set('checkInDate', e.target.value)}
                      className={`pms-input font-mono ${errors.checkInDate ? 'border-neon-red/50' : ''}`}
                    />
                  </Field>
                  <Field label="Check-Out Date" error={errors.checkOutDate} required>
                    <input
                      type="date"
                      value={form.checkOutDate}
                      min={form.checkInDate || undefined}
                      onChange={(e) => set('checkOutDate', e.target.value)}
                      className={`pms-input font-mono ${errors.checkOutDate ? 'border-neon-red/50' : ''}`}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Adults">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => set('adults', String(Math.max(1, parseInt(form.adults) - 1)))}
                        className="btn btn-ghost w-8 h-8 justify-center p-0 text-lg leading-none flex-shrink-0"
                      >−</button>
                      <span className="flex-1 text-center font-mono font-bold text-slate-200">{form.adults}</span>
                      <button
                        type="button"
                        onClick={() => set('adults', String(Math.min(8, parseInt(form.adults) + 1)))}
                        className="btn btn-ghost w-8 h-8 justify-center p-0 text-lg leading-none flex-shrink-0"
                      >+</button>
                    </div>
                  </Field>
                  <Field label="Children">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => set('children', String(Math.max(0, parseInt(form.children) - 1)))}
                        className="btn btn-ghost w-8 h-8 justify-center p-0 text-lg leading-none flex-shrink-0"
                      >−</button>
                      <span className="flex-1 text-center font-mono font-bold text-slate-200">{form.children}</span>
                      <button
                        type="button"
                        onClick={() => set('children', String(Math.min(6, parseInt(form.children) + 1)))}
                        className="btn btn-ghost w-8 h-8 justify-center p-0 text-lg leading-none flex-shrink-0"
                      >+</button>
                    </div>
                  </Field>
                </div>
              </Section>

              {/* Room */}
              <Section title="Room Assignment" icon="room">
                <Field label="Room Type" error={errors.roomType} required>
                  <div className="grid grid-cols-4 gap-1.5">
                    {ROOM_TYPES.map((rt) => (
                      <button
                        type="button"
                        key={rt}
                        onClick={() => { set('roomType', rt); set('roomNumber', ''); }}
                        className={`btn text-[11px] py-2 justify-center border transition-all ${
                          form.roomType === rt
                            ? 'bg-cyber/15 border-cyber/40 text-cyber'
                            : 'btn-ghost'
                        }`}
                      >
                        {rt}
                      </button>
                    ))}
                  </div>
                  {errors.roomType && <p className="text-[10px] text-neon-red mt-1">{errors.roomType}</p>}
                </Field>

                {form.roomType && (
                  <Field label="Room Number (optional)">
                    {availableRooms.length === 0 ? (
                      <p className="text-[11px] font-mono text-neon-amber/80 py-2">No {form.roomType} rooms available</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => set('roomNumber', '')}
                          className={`text-[10px] font-mono px-2.5 py-1.5 rounded-sm border transition-all ${
                            !form.roomNumber
                              ? 'bg-space-700 border-cyber/25 text-slate-400'
                              : 'border-space-600 text-slate-600 hover:border-space-500'
                          }`}
                        >
                          Auto-assign
                        </button>
                        {availableRooms.map((r) => (
                          <button
                            type="button"
                            key={r.roomNumber}
                            onClick={() => set('roomNumber', r.roomNumber)}
                            className={`text-[10px] font-mono px-2.5 py-1.5 rounded-sm border transition-all ${
                              form.roomNumber === r.roomNumber
                                ? 'bg-cyber/15 border-cyber/40 text-cyber'
                                : 'border-space-600 text-slate-500 hover:border-cyber/20 hover:text-slate-400'
                            }`}
                          >
                            {r.roomNumber}
                            <span className="text-[8px] ml-1 opacity-60">Fl.{r.floor}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </Field>
                )}
              </Section>

              {/* Deposit & Preferences */}
              <Section title="Deposit & Preferences" icon="deposit">
                <Field label="Deposit Status">
                  <div className="flex gap-1.5">
                    {DEPOSIT_OPTIONS.map((d) => (
                      <button
                        type="button"
                        key={d.value}
                        onClick={() => set('depositStatus', d.value)}
                        className={`btn flex-1 justify-center text-[11px] py-2 transition-all border ${
                          form.depositStatus === d.value
                            ? d.value === 'Paid'
                              ? 'bg-neon-green/15 border-neon-green/35 text-neon-green'
                              : d.value === 'Pending'
                              ? 'bg-neon-amber/15 border-neon-amber/35 text-neon-amber'
                              : 'bg-space-700 border-space-500 text-slate-400'
                            : 'btn-ghost'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Toggle
                    label="Early Check-In"
                    sublabel="Subject to availability"
                    checked={form.earlyCheckIn}
                    onChange={(v) => set('earlyCheckIn', v)}
                    color="purple"
                  />
                  <Toggle
                    label="Late Check-Out"
                    sublabel="Subject to availability"
                    checked={form.lateCheckOut}
                    onChange={(v) => set('lateCheckOut', v)}
                    color="cyan"
                  />
                </div>
              </Section>

              {/* Special Requests */}
              <Section title="Special Requests" icon="note">
                <Field label="Notes">
                  <textarea
                    value={form.specialRequests}
                    onChange={(e) => set('specialRequests', e.target.value)}
                    className="pms-input resize-none font-mono text-[11px] leading-relaxed"
                    rows={3}
                    placeholder="High floor preference, anniversary setup, accessibility requirements..."
                    maxLength={500}
                  />
                  {form.specialRequests && (
                    <p className="text-[9px] font-mono text-slate-700 mt-1 text-right">{form.specialRequests.length}/500</p>
                  )}
                </Field>
              </Section>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-solid-cyber w-full justify-center py-3 text-sm font-bold tracking-wider"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                    CREATING RESERVATION
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    CONFIRM RESERVATION
                  </span>
                )}
              </button>
            </div>

            {/* ── Right column — live summary ─────────────────────────── */}
            <div className="w-64 flex-shrink-0 space-y-3 sticky top-0">

              {/* Booking summary card */}
              <div className="card-cyber rounded-sm p-4 brackets">
                <p className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-3">Booking Summary</p>

                {/* Guest */}
                <div className="mb-4">
                  <div className="w-10 h-10 rounded-sm bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center mx-auto mb-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <p className="text-center font-semibold text-slate-200 text-sm leading-tight">
                    {form.guestFirstName || form.guestLastName
                      ? `${form.guestLastName}${form.guestLastName && form.guestFirstName ? ', ' : ''}${form.guestFirstName}`
                      : <span className="text-slate-700 font-normal text-xs">Guest name</span>}
                  </p>
                  {form.loyaltyTier !== 'None' && (
                    <p className={`text-center text-[10px] font-mono mt-0.5 ${TIER_OPTIONS.find((t) => t.value === form.loyaltyTier)?.cls}`}>
                      {form.loyaltyTier} Member
                    </p>
                  )}
                </div>

                <div className="cyber-divider mb-3" />

                {/* Details */}
                <div className="space-y-2 font-mono text-[10px]">
                  <SummaryRow
                    label="Room"
                    value={form.roomType
                      ? `${form.roomType}${form.roomNumber ? ` · ${form.roomNumber}` : ' · Auto'}`
                      : undefined}
                  />
                  <SummaryRow label="Check-In"  value={form.checkInDate  || undefined} />
                  <SummaryRow label="Check-Out" value={form.checkOutDate || undefined} />
                  <SummaryRow
                    label="Nights"
                    value={nights > 0 ? String(nights) : undefined}
                    highlight={nights > 0}
                  />
                  <SummaryRow
                    label="Guests"
                    value={`${form.adults} adult${parseInt(form.adults) !== 1 ? 's' : ''}${parseInt(form.children) > 0 ? ` · ${form.children} child${parseInt(form.children) !== 1 ? 'ren' : ''}` : ''}`}
                  />
                  <SummaryRow label="Deposit"   value={form.depositStatus} />
                </div>

                {(form.earlyCheckIn || form.lateCheckOut) && (
                  <>
                    <div className="cyber-divider my-3" />
                    <div className="flex gap-1.5 flex-wrap">
                      {form.earlyCheckIn  && <span className="badge badge-purple text-[9px]">Early Check-In</span>}
                      {form.lateCheckOut  && <span className="badge badge-cyan text-[9px]">Late Check-Out</span>}
                    </div>
                  </>
                )}

                {nights > 0 && (
                  <>
                    <div className="cyber-divider my-3" />
                    <div className="text-center">
                      <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">Duration</p>
                      <p className="text-2xl font-mono font-bold text-cyber">{nights}</p>
                      <p className="text-[9px] font-mono text-slate-600">night{nights !== 1 ? 's' : ''}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Available rooms for selected type */}
              {form.roomType && (
                <div className="card-cyber rounded-sm p-4">
                  <p className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-2">
                    {form.roomType} Availability
                  </p>
                  <div className="space-y-1">
                    {availableRooms.slice(0, 5).map((r) => (
                      <div
                        key={r.roomNumber}
                        onClick={() => set('roomNumber', form.roomNumber === r.roomNumber ? '' : r.roomNumber)}
                        className={`flex items-center justify-between p-1.5 rounded-sm cursor-pointer border transition-all ${
                          form.roomNumber === r.roomNumber
                            ? 'bg-cyber/10 border-cyber/25'
                            : 'border-transparent hover:border-space-600'
                        }`}
                      >
                        <span className="font-mono text-[11px] text-slate-400">Room {r.roomNumber}</span>
                        <span className="text-[9px] font-mono text-slate-600">Floor {r.floor}</span>
                      </div>
                    ))}
                    {availableRooms.length > 5 && (
                      <p className="text-[9px] font-mono text-slate-700 text-center pt-1">
                        +{availableRooms.length - 5} more available
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Validation hints */}
              {Object.keys(errors).length > 0 && (
                <div className="card-cyber rounded-sm p-3 border-neon-red/20">
                  <p className="text-[9px] font-mono font-bold text-neon-red uppercase tracking-widest mb-2">Required Fields</p>
                  <div className="space-y-1">
                    {Object.values(errors).filter(Boolean).map((msg, i) => (
                      <p key={i} className="text-[10px] font-mono text-neon-red/80">· {msg}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </main>
    </>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const ICONS: Record<string, React.ReactNode> = {
    guest: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    member: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    stay: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    room: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      </svg>
    ),
    deposit: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    note: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  };

  return (
    <div className="card-cyber rounded-sm p-5 brackets">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-cyber/60">{ICONS[icon]}</span>
        <h3 className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label, error, required, children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
        {label}{required && <span className="text-neon-red ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] text-neon-red mt-1 font-mono">{error}</p>}
    </div>
  );
}

function Toggle({
  label, sublabel, checked, onChange, color,
}: {
  label: string;
  sublabel: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  color: 'purple' | 'cyan';
}) {
  const colors = {
    purple: { on: 'bg-neon-purple border-neon-purple/40', off: 'bg-space-700 border-space-600', dot: 'bg-neon-purple' },
    cyan:   { on: 'bg-cyber/20 border-cyber/40',          off: 'bg-space-700 border-space-600', dot: 'bg-cyber' },
  }[color];

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 p-3 rounded-sm border transition-all text-left ${
        checked ? `${colors.on} bg-opacity-10` : colors.off
      }`}
    >
      <div className={`w-8 h-4 rounded-full border flex items-center transition-all flex-shrink-0 ${
        checked ? `border-current ${color === 'purple' ? 'bg-neon-purple/30' : 'bg-cyber/30'}` : 'border-space-500 bg-space-800'
      }`}>
        <div className={`w-3 h-3 rounded-full transition-all ml-0.5 ${
          checked ? `${colors.dot} translate-x-4` : 'bg-slate-600'
        }`} />
      </div>
      <div>
        <p className={`text-[11px] font-semibold leading-tight ${checked ? (color === 'purple' ? 'text-neon-purple' : 'text-cyber') : 'text-slate-500'}`}>
          {label}
        </p>
        <p className="text-[9px] font-mono text-slate-700 leading-tight">{sublabel}</p>
      </div>
    </button>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value?: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-cyber/4">
      <span className="text-slate-600">{label}</span>
      {value
        ? <span className={highlight ? 'text-cyber font-bold' : 'text-slate-400'}>{value}</span>
        : <span className="text-slate-700">—</span>}
    </div>
  );
}
