'use client';

import { useEffect, useRef, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { sha256, sha256File } from '@/lib/utils/hash';
import { initiatePreArrival, issueToken } from '@/lib/api/digitcard';
import { formatCents } from '@/lib/utils/currency';
import { ApiError } from '@/lib/api/client';
import type { PreArrivalResult, TokenResult } from '@/lib/api/types';

type Step = 1 | 2 | 3 | 4;

interface MockReservation {
  id: string;
  confirmationNumber: string;
  guestFirstName: string;
  guestLastName: string;
  roomType: string;
  roomNumber: string | null;
  checkInDate: string;
  depositStatus: 'Paid' | 'Pending' | 'Future';
  status: string;
}

const MOCK_LOOKUP: Record<string, MockReservation> = {
  'KEM-AR1002': { id: '8', confirmationNumber: 'KEM-AR1002', guestFirstName: 'B***n', guestLastName: 'M***s', roomType: 'King', roomNumber: '104', checkInDate: '2026-06-17', depositStatus: 'Paid', status: 'Arrival' },
  'KEM-AR1001': { id: '7', confirmationNumber: 'KEM-AR1001', guestFirstName: 'A***a', guestLastName: 'T*****r', roomType: 'Suite', roomNumber: null, checkInDate: '2026-06-17', depositStatus: 'Paid', status: 'Arrival' },
};

export default function DigitcardPage() {
  const [step, setStep] = useState<Step>(1);
  const [confNumber, setConfNumber] = useState('');
  const [reservation, setReservation] = useState<MockReservation | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [idFile, setIdFile] = useState<File | null>(null);
  const [idHash, setIdHash] = useState<string | null>(null);

  const [deviceHash, setDeviceHash] = useState<string | null>(null);
  const [preArrivalResult, setPreArrivalResult] = useState<PreArrivalResult | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  const [tokenResult, setTokenResult] = useState<TokenResult | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [issuingToken, setIssuingToken] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isCheckInDay = reservation
    ? new Date().toISOString().split('T')[0] === reservation.checkInDate
    : false;

  useEffect(() => {
    void generateDeviceHash();
  }, []);

  async function generateDeviceHash() {
    const fingerprint = [
      navigator.userAgent,
      screen.width,
      screen.height,
      navigator.language,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ].join('|');
    const hash = await sha256(fingerprint);
    setDeviceHash(hash);
  }

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLookupError(null);
    const res = MOCK_LOOKUP[confNumber.toUpperCase()];
    if (!res) { setLookupError('Reservation not found'); return; }
    if (res.status !== 'Arrival') { setLookupError(`Reservation status is "${res.status}" — digital check-in requires Arrival status`); return; }
    setReservation(res);
    setStep(2);
  }

  async function handleIdUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIdFile(file);
    const hash = await sha256File(file);
    setIdHash(hash);
  }

  async function handleRegister() {
    if (!reservation || !deviceHash) return;
    if (reservation.depositStatus !== 'Paid') {
      setRegisterError('Advance deposit required before digital check-in');
      return;
    }
    setRegistering(true);
    setRegisterError(null);
    try {
      const result = await initiatePreArrival({
        reservationId: reservation.id,
        deviceHardwareId: deviceHash,
        ...(idHash ? { identityDocBase64: idHash } : {}),
      });
      setPreArrivalResult(result);
      setStep(4);
    } catch (e) {
      setRegisterError(e instanceof ApiError ? e.message : 'Registration failed');
    } finally {
      setRegistering(false);
    }
  }

  async function handleIssueToken() {
    if (!reservation || !deviceHash) return;
    setIssuingToken(true);
    setTokenError(null);
    try {
      const result = await issueToken({
        reservationId: reservation.id,
        deviceHardwareId: deviceHash,
      });
      setTokenResult(result);
      const expiresAt = new Date(result.expiresAt).getTime();
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setSecondsLeft(remaining);
        if (remaining === 0 && timerRef.current) clearInterval(timerRef.current);
      }, 1000);
    } catch (e) {
      setTokenError(e instanceof ApiError ? e.message : 'Token issuance failed');
    } finally {
      setIssuingToken(false);
    }
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return (
    <>
      <TopBar title="Digital Check-In" subtitle="DigitCard Pre-Arrival" />

      <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {([1, 2, 3, 4] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-sm flex items-center justify-center text-[11px] font-mono font-bold transition-all ${step >= s ? 'bg-cyber/20 border border-cyber/40 text-cyber' : 'bg-space-800 border border-space-600 text-slate-600'}`}>
                  {s}
                </div>
                {i < 3 && <div className={`flex-1 h-px w-8 ${step > s ? 'bg-cyber/40' : 'bg-space-700'}`} />}
              </div>
            ))}
            <div className="ml-auto flex gap-4 text-[10px] font-mono text-slate-600">
              <span className={step === 1 ? 'text-cyber' : ''}>Lookup</span>
              <span className={step === 2 ? 'text-cyber' : ''}>Identity</span>
              <span className={step === 3 ? 'text-cyber' : ''}>Register</span>
              <span className={step === 4 ? 'text-cyber' : ''}>Key</span>
            </div>
          </div>

          {/* Step 1: Reservation Lookup */}
          {step === 1 && (
            <div className="card-cyber rounded-sm p-6 brackets">
              <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-4">Step 1 — Reservation Lookup</p>
              <form onSubmit={handleLookup} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Confirmation Number</label>
                  <input
                    type="text"
                    value={confNumber}
                    onChange={(e) => setConfNumber(e.target.value.toUpperCase())}
                    placeholder="KEM-XXXXXX"
                    className="pms-input font-mono tracking-widest"
                    required
                  />
                </div>
                {lookupError && <p className="text-neon-red text-xs font-mono">{lookupError}</p>}
                <button type="submit" className="btn btn-solid-cyber w-full justify-center">Look Up Reservation</button>
              </form>
            </div>
          )}

          {/* Step 2: Identity Verification */}
          {step === 2 && reservation && (
            <div className="card-cyber rounded-sm p-6 brackets space-y-4">
              <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Step 2 — Identity Verification</p>

              <div className="p-4 bg-space-800 rounded-sm border border-cyber/10 space-y-2">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-600">Guest</span>
                  <span className="text-slate-300">{reservation.guestLastName}, {reservation.guestFirstName}</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-600">Room Type</span>
                  <span className="text-slate-300">{reservation.roomType}</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-600">Check-In</span>
                  <span className="text-slate-300">{reservation.checkInDate}</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-600">Deposit</span>
                  <span className={reservation.depositStatus === 'Paid' ? 'text-neon-green' : 'text-neon-amber'}>
                    {reservation.depositStatus}
                  </span>
                </div>
              </div>

              {reservation.depositStatus !== 'Paid' ? (
                <div className="flex items-center gap-2 p-3 rounded-sm bg-neon-amber/5 border border-neon-amber/20">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBB040" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
                  <span className="text-xs text-neon-amber">Advance deposit required before digital check-in</span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-2">Upload ID Document</label>
                    <p className="text-[10px] text-slate-600 mb-3">Your ID will be verified securely. We do not store your document — only a cryptographic hash.</p>
                    <label className="flex items-center gap-3 p-4 border border-dashed border-cyber/25 rounded-sm cursor-pointer hover:border-cyber/50 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00CFFF" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <div>
                        <p className="text-xs font-mono text-slate-300">{idFile ? idFile.name : 'Choose passport or driver\'s licence'}</p>
                        {idHash && <p className="text-[10px] font-mono text-neon-green mt-0.5">✓ Hashed: {idHash.substring(0, 16)}…</p>}
                      </div>
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdUpload} />
                    </label>
                  </div>
                  <button onClick={() => setStep(3)} className="btn btn-cyber w-full justify-center">
                    Continue to Registration
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 3: Device Registration */}
          {step === 3 && reservation && (
            <div className="card-cyber rounded-sm p-6 brackets space-y-4">
              <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Step 3 — Device Registration</p>

              <div className="p-4 bg-space-800 rounded-sm border border-cyber/10 space-y-2">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-600">Device ID</span>
                  <span className="text-cyber font-mono text-[10px]">{deviceHash ? `${deviceHash.substring(0, 16)}…` : 'Generating…'}</span>
                </div>
                {idHash && (
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-600">ID Doc Hash</span>
                    <span className="text-neon-green text-[10px]">{idHash.substring(0, 16)}…</span>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-sm bg-space-800 border border-cyber/10">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00CFFF" strokeWidth="1.5" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="text-[10px] text-slate-500">Device fingerprint is hashed in your browser and never transmitted in plaintext.</p>
              </div>

              {registerError && <p className="text-neon-red text-xs font-mono">{registerError}</p>}

              <button
                onClick={handleRegister}
                disabled={registering || !deviceHash}
                className="btn btn-solid-cyber w-full justify-center"
              >
                {registering ? 'Registering…' : 'Complete Pre-Arrival Registration'}
              </button>
            </div>
          )}

          {/* Step 4: Key Issuance */}
          {step === 4 && reservation && (
            <div className="card-cyber rounded-sm p-6 brackets space-y-4">
              <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Step 4 — Digital Key</p>

              {preArrivalResult && (
                <div className="flex items-center gap-2 p-3 rounded-sm bg-neon-green/5 border border-neon-green/20">
                  <span className="status-dot dot-green" style={{ width: 6, height: 6 }} />
                  <span className="text-xs text-neon-green font-mono">Pre-arrival check-in registered — confirmation {preArrivalResult.tokenHashPrefix}</span>
                </div>
              )}

              {!isCheckInDay ? (
                <div className="p-6 text-center">
                  <p className="text-slate-500 text-sm">Digital key will be available on</p>
                  <p className="text-xl font-mono font-bold text-cyber mt-1">{reservation.checkInDate}</p>
                </div>
              ) : !tokenResult ? (
                <>
                  <p className="text-xs text-slate-500">Today is your check-in day. Request your digital room key below.</p>
                  {tokenError && <p className="text-neon-red text-xs font-mono">{tokenError}</p>}
                  <button
                    onClick={handleIssueToken}
                    disabled={issuingToken || !reservation.roomNumber}
                    className="btn btn-solid-cyber w-full justify-center"
                  >
                    {issuingToken ? 'Issuing Key…' : 'Request Digital Key'}
                  </button>
                  {!reservation.roomNumber && (
                    <p className="text-[10px] text-neon-amber font-mono">Room not yet assigned — contact front desk</p>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-6 bg-space-800 rounded-sm border border-cyber/20 text-center space-y-3">
                    <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Room</p>
                    <p className="text-4xl font-mono font-bold text-cyber glow-cyber">{tokenResult.roomNumber}</p>
                    <div className="cyber-divider" />
                    <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Access Token</p>
                    <p className="text-[10px] font-mono text-slate-400 break-all">{tokenResult.token.substring(0, 48)}…</p>
                  </div>

                  {secondsLeft > 0 ? (
                    <div className="flex items-center justify-between p-3 bg-neon-amber/5 border border-neon-amber/20 rounded-sm">
                      <div className="flex items-center gap-2">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FBB040" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span className="text-xs text-neon-amber font-mono">Key expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</span>
                      </div>
                      <button onClick={handleIssueToken} className="btn btn-ghost text-[10px]">Renew</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-neon-red/5 border border-neon-red/20 rounded-sm">
                      <span className="text-xs text-neon-red font-mono">Key expired</span>
                      <button onClick={handleIssueToken} className="btn btn-cyber text-[10px] ml-auto">Request New Key</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
