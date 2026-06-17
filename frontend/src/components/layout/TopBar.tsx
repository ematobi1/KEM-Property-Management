'use client';

import { useEffect, useState } from 'react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function TopBar({ title, subtitle, actions }: TopBarProps) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 border-b border-cyber/8 bg-space-900/80 backdrop-blur-sm relative">
      {/* Left glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber/15 to-transparent" />

      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-slate-100 tracking-wide">{title}</h1>
            {subtitle && (
              <>
                <span className="text-slate-700">/</span>
                <span className="text-xs text-slate-500">{subtitle}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {actions}

        {/* Clock */}
        <div className="text-right hidden sm:block">
          <p className="text-xs font-mono text-cyber glow-cyber leading-none">{time}</p>
          <p className="text-[10px] font-mono text-slate-600 mt-0.5">{date}</p>
        </div>

        {/* Notification dot */}
        <div className="relative">
          <button className="w-8 h-8 rounded-sm border border-cyber/15 bg-cyber/5 flex items-center justify-center hover:border-cyber/35 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A9CC4" strokeWidth="1.5">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </button>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red border border-space-900" />
        </div>
      </div>
    </header>
  );
}
