import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-space-950">
      {/* Background grid */}
      <div
        className="fixed inset-0 bg-grid-subtle opacity-40 pointer-events-none"
        style={{ backgroundSize: '40px 40px' }}
      />
      {/* Top radial glow */}
      <div className="fixed inset-0 bg-radial-glow pointer-events-none" />

      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
