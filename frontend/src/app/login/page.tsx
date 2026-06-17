'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', propertyCode: 'KEM01' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate auth — replace with: await fetch('/api/auth/login', ...)
    await new Promise((r) => setTimeout(r, 900));

    if (form.email && form.password) {
      localStorage.setItem('pms_session', JSON.stringify({
        token: 'mock-jwt-token',
        user: {
          id: 'u1',
          firstName: 'Ngalame',
          lastName: 'Kate',
          initials: 'GP',
          role: 'FrontDeskAgent',
          propertyId: 'kem-property-id',
        },
      }));
      router.push('/dashboard');
    } else {
      setError('Invalid credentials. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-space-950 flex items-center justify-center relative overflow-hidden">

      {/* Background grid */}
      <div
        className="absolute inset-0 bg-grid-subtle bg-grid opacity-60"
        style={{ backgroundSize: '40px 40px' }}
      />

      {/* Radial glow */}
      <div className="absolute inset-0 bg-radial-glow" />

      {/* Animated scan line */}
      <div className="scan-line" />

      {/* Corner accents */}
      <div className="absolute top-6 left-6 w-12 h-12 border-l border-t border-cyber/30" />
      <div className="absolute top-6 right-6 w-12 h-12 border-r border-t border-cyber/30" />
      <div className="absolute bottom-6 left-6 w-12 h-12 border-l border-b border-cyber/30" />
      <div className="absolute bottom-6 right-6 w-12 h-12 border-r border-b border-cyber/30" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm animate-slide-up">
        <div className="card-cyber rounded-sm p-8 brackets">

          {/* Logo / System ID */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-sm bg-cyber/10 border border-cyber/30 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00CFFF" strokeWidth="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-cyber uppercase">KEM PMS 1.1</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-100 leading-tight">
              KEM Property Management
            </h1>
            <p className="text-xs font-mono text-cyber/80 tracking-widest mt-1 uppercase">
              System 1.1
            </p>
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-sm bg-cyber/5 border border-cyber/15">
              <span className="status-dot dot-green" style={{ width: 6, height: 6 }} />
              <span className="text-[10px] font-mono text-slate-400 tracking-wider">KEM01 · SYSTEM ONLINE</span>
            </div>
          </div>

          <div className="cyber-divider mb-6" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Property Code
              </label>
              <input
                type="text"
                value={form.propertyCode}
                onChange={(e) => setForm({ ...form, propertyCode: e.target.value.toUpperCase() })}
                className="pms-input font-mono text-cyber tracking-widest"
                maxLength={5}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Staff Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="staff@kem.com"
                className="pms-input"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Access Code
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••••"
                className="pms-input"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-sm bg-neon-red/5 border border-neon-red/20">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF4757" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span className="text-xs text-neon-red">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-solid-cyber w-full justify-center py-2.5 mt-2 text-sm font-bold tracking-wider"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  AUTHENTICATING
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  ACCESS SYSTEM
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-600 mt-6 font-mono">
            RESTRICTED ACCESS · AUTHORIZED PERSONNEL ONLY
          </p>
        </div>

        {/* System info */}
        <div className="flex justify-between mt-4 px-1">
          <span className="text-[10px] font-mono text-slate-700">BUILD 2026.06.16</span>
          <span className="text-[10px] font-mono text-slate-700">KEM SYSTEMS</span>
        </div>
      </div>
    </div>
  );
}
