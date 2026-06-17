'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';

const NAV = [
  {
    label: 'OPERATIONS',
    items: [
      { href: '/dashboard', label: 'Overview', icon: OverviewIcon },
      { href: '/dashboard/in-house', label: 'In-House', icon: InHouseIcon, badge: '84' },
      { href: '/dashboard/arrivals', label: 'Arrivals', icon: ArrivalsIcon, badge: '22' },
      { href: '/dashboard/departures', label: 'Departures', icon: DeparturesIcon, badge: '17' },
      { href: '/dashboard/housekeeping', label: 'Housekeeping', icon: HousekeepingIcon },
    ],
  },
  {
    label: 'RESERVATIONS',
    items: [
      { href: '/dashboard/reservations/search', label: 'Search', icon: SearchReservationIcon },
      { href: '/dashboard/reservations/new', label: 'New Reservation', icon: NewReservationIcon },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { href: '/dashboard/finance/ledger', label: 'Folio & Ledger', icon: LedgerIcon },
      { href: '/dashboard/rate-management', label: 'Rate Management', icon: RateIcon },
    ],
  },
  {
    label: 'GUEST SERVICES',
    items: [
      { href: '/dashboard/digitcard', label: 'Digital Check-In', icon: DigitcardIcon },
    ],
  },
  {
    label: 'ADVANCED',
    items: [
      { href: '/dashboard/allocation-log', label: 'Allocation Log', icon: AllocationIcon },
      { href: '/dashboard/localization/japan', label: 'Packages & Revenue', icon: PackagesIcon },
      { href: '/dashboard/localization/china', label: 'Channels & Compliance', icon: ChannelsIcon },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem('pms_session');
    router.push('/login');
  }

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-sidebar-gradient border-r border-cyber/8 relative">

      {/* Top glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber/40 to-transparent" />

      {/* Property header */}
      <div className="px-4 pt-5 pb-4 border-b border-cyber/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-cyber/10 border border-cyber/25 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00CFFF" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-200 leading-tight truncate">KEM Property Management</p>
            <p className="text-[10px] font-mono text-cyber/70 tracking-widest uppercase">KEM01</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3">
          <span className="status-dot dot-green" style={{ width: 6, height: 6 }} />
          <span className="text-[9px] font-mono text-slate-500 tracking-wider uppercase">KEM PMS 1.1 · Online</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV.map((section) => (
          <div key={section.label}>
            <p className="text-[9px] font-mono font-bold text-slate-600 tracking-[0.2em] uppercase px-2 mb-1.5">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx('nav-item', { active: isActive })}
                  >
                    <item.icon size={15} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={clsx(
                        'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm',
                        isActive
                          ? 'bg-cyber/20 text-cyber'
                          : 'bg-space-700 text-slate-500'
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-cyber/8 px-3 py-3">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-sm bg-neon-purple/15 border border-neon-purple/25 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-neon-purple">GP</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-300 truncate">Ngalame Kate</p>
            <p className="text-[9px] font-mono text-slate-600 truncate">Front Desk Agent</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost w-full justify-center text-[10px] py-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </div>

      {/* Bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber/20 to-transparent" />
    </aside>
  );
}

// ─── Icon components ──────────────────────────────────────────────────────────
function OverviewIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}
function InHouseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}
function ArrivalsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
    </svg>
  );
}
function DeparturesIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
    </svg>
  );
}
function HousekeepingIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function ExtensionsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
    </svg>
  );
}
function LedgerIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}
function PackagesIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}
function ChannelsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
      <line x1="12" y1="7" x2="5" y2="17"/><line x1="12" y1="7" x2="19" y2="17"/>
    </svg>
  );
}
function RateIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/>
    </svg>
  );
}
function DigitcardIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
      <line x1="6" y1="15" x2="10" y2="15"/>
    </svg>
  );
}
function AllocationIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><line x1="8" y1="22" x2="8" y2="12"/><line x1="16" y1="22" x2="16" y2="12"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  );
}
function SearchReservationIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
    </svg>
  );
}
function NewReservationIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>
    </svg>
  );
}
