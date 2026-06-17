'use client';

import { useState, useMemo } from 'react';
import TopBar from '@/components/layout/TopBar';
import type { Room, HousekeepingStatus } from '@/types';
import { MOCK_ROOMS } from '@/lib/mock';

// ─── Config ───────────────────────────────────────────────────────────────────

type ViewMode = 'housekeeper' | 'floor-zone';

const HK_STATUS: Record<HousekeepingStatus, { label: string; cardCls: string; nextStatus: HousekeepingStatus | null; nextLabel: string; badgeCls: string; dot: string }> = {
  Dirty: { label: 'Dirty', cardCls: 'room-dirty', nextStatus: 'Clean', nextLabel: 'Mark Clean', badgeCls: 'badge-red',   dot: 'dot-red' },
  Clean: { label: 'Clean', cardCls: 'room-clean', nextStatus: 'Ready', nextLabel: 'Mark Ready', badgeCls: 'badge-amber', dot: 'dot-amber' },
  Ready: { label: 'Ready', cardCls: 'room-ready', nextStatus: 'Dirty', nextLabel: 'Mark Dirty', badgeCls: 'badge-green', dot: 'dot-green' },
};

interface Housekeeper {
  id: string;
  name: string;
  initials: string;
  bgCls: string;
  borderCls: string;
  textCls: string;
  ringCls: string;
}

const STAFF: Housekeeper[] = [
  { id: 'hk1', name: 'Alice Mensah',  initials: 'AM', bgCls: 'bg-neon-purple/10', borderCls: 'border-neon-purple/30', textCls: 'text-neon-purple', ringCls: 'ring-neon-purple/40' },
  { id: 'hk2', name: 'Ben Tran',      initials: 'BT', bgCls: 'bg-neon-green/10',  borderCls: 'border-neon-green/30',  textCls: 'text-neon-green',  ringCls: 'ring-neon-green/40' },
  { id: 'hk3', name: 'Carmen Sosa',   initials: 'CS', bgCls: 'bg-neon-amber/10',  borderCls: 'border-neon-amber/30',  textCls: 'text-neon-amber',  ringCls: 'ring-neon-amber/40' },
  { id: 'hk4', name: 'David Osei',    initials: 'DO', bgCls: 'bg-cyber/10',        borderCls: 'border-cyber/30',        textCls: 'text-cyber',        ringCls: 'ring-cyber/40' },
];

const INITIAL_ASSIGNMENTS: Record<string, string | null> = {
  '101': 'hk1', '102': 'hk1', '103': 'hk1',
  '201': 'hk2', '203': 'hk2', '205': 'hk2',
  '301': 'hk3', '302': 'hk3', '304': 'hk3',
  '401': 'hk4', '402': 'hk4', '403': 'hk4',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HousekeepingPage() {
  const [rooms, setRooms]           = useState<Room[]>(MOCK_ROOMS);
  const [assignments, setAssignments] = useState<Record<string, string | null>>(INITIAL_ASSIGNMENTS);
  const [viewMode, setViewMode]     = useState<ViewMode>('housekeeper');
  const [activeHK, setActiveHK]     = useState<string | null>(null);
  const [assigningRoom, setAssigningRoom] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom]   = useState<string | null>(null);

  const counts = useMemo(() => ({
    Dirty: rooms.filter((r) => r.housekeepingStatus === 'Dirty').length,
    Clean: rooms.filter((r) => r.housekeepingStatus === 'Clean').length,
    Ready: rooms.filter((r) => r.housekeepingStatus === 'Ready').length,
  }), [rooms]);

  function advance(roomNumber: string) {
    setRooms((prev) => prev.map((r) => {
      if (r.roomNumber !== roomNumber) return r;
      const next = HK_STATUS[r.housekeepingStatus].nextStatus;
      return next ? { ...r, housekeepingStatus: next } : r;
    }));
    setSelectedRoom(null);
  }

  function assignRoom(roomNumber: string, hkId: string | null) {
    setAssignments((prev) => ({ ...prev, [roomNumber]: hkId }));
    setAssigningRoom(null);
  }

  const roomMap = useMemo(() => Object.fromEntries(rooms.map((r) => [r.roomNumber, r])), [rooms]);

  const floors = useMemo(() => Array.from(new Set(rooms.map((r) => r.floor))).sort(), [rooms]);

  return (
    <>
      <TopBar
        title="Housekeeping"
        subtitle="Room Management"
        actions={
          <div className="flex gap-2">
            <span className="badge badge-red">{counts.Dirty} Dirty</span>
            <span className="badge badge-amber">{counts.Clean} Clean</span>
            <span className="badge badge-green">{counts.Ready} Ready</span>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-5 animate-fade-in">

        {/* ── View mode toggle ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 border border-space-700 rounded-sm p-0.5">
            <button
              onClick={() => setViewMode('housekeeper')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-[11px] font-mono font-bold transition-all ${
                viewMode === 'housekeeper'
                  ? 'bg-cyber/15 text-cyber border border-cyber/25'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <StaffIcon /> By Housekeeper
            </button>
            <button
              onClick={() => setViewMode('floor-zone')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-[11px] font-mono font-bold transition-all ${
                viewMode === 'floor-zone'
                  ? 'bg-cyber/15 text-cyber border border-cyber/25'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <FloorIcon /> By Floor & Zone
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4">
            {[
              { cls: 'bg-neon-red/60',   label: 'Dirty' },
              { cls: 'bg-neon-amber/60', label: 'Clean' },
              { cls: 'bg-neon-green/60', label: 'Ready' },
              { cls: 'bg-slate-600',     label: 'OOO' },
            ].map(({ cls, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${cls}`} />
                <span className="text-[10px] font-mono text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── BY HOUSEKEEPER ───────────────────────────────────────────── */}
        {viewMode === 'housekeeper' && (
          <div className="space-y-5">

            {/* Housekeeper cards */}
            <div className="grid grid-cols-4 gap-3">
              {STAFF.map((hk) => {
                const assignedNums  = Object.entries(assignments).filter(([, v]) => v === hk.id).map(([k]) => k);
                const assignedRooms = assignedNums.map((n) => roomMap[n]).filter(Boolean) as Room[];
                const done          = assignedRooms.filter((r) => r.housekeepingStatus === 'Ready').length;
                const pct           = assignedRooms.length > 0 ? Math.round((done / assignedRooms.length) * 100) : 0;
                const isActive      = activeHK === hk.id;

                return (
                  <button
                    key={hk.id}
                    onClick={() => setActiveHK(isActive ? null : hk.id)}
                    className={`card-cyber rounded-sm p-4 text-left transition-all ${
                      isActive ? `${hk.borderCls} shadow-panel ring-2 ${hk.ringCls}` : 'hover:border-cyber/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={`w-9 h-9 rounded-sm ${hk.bgCls} border ${hk.borderCls} flex items-center justify-center flex-shrink-0`}>
                        <span className={`text-[11px] font-bold font-mono ${hk.textCls}`}>{hk.initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-slate-200 truncate">{hk.name}</p>
                        <p className="text-[10px] font-mono text-slate-600">{assignedRooms.length} rooms assigned</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-slate-600">PROGRESS</span>
                        <span className={hk.textCls}>{pct}%</span>
                      </div>
                      <div className="h-1 bg-space-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            hk.id === 'hk1' ? 'bg-neon-purple' :
                            hk.id === 'hk2' ? 'bg-neon-green' :
                            hk.id === 'hk3' ? 'bg-neon-amber' : 'bg-cyber'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex gap-2 text-[9px] font-mono text-slate-700">
                        <span>{assignedRooms.filter((r) => r.housekeepingStatus === 'Dirty').length} dirty</span>
                        <span>·</span>
                        <span>{assignedRooms.filter((r) => r.housekeepingStatus === 'Clean').length} clean</span>
                        <span>·</span>
                        <span className={done > 0 ? 'text-neon-green' : ''}>{done} ready</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Room pool / filtered list */}
            <div className="flex gap-5">

              {/* Left: room grid */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                    {activeHK
                      ? `${STAFF.find((h) => h.id === activeHK)?.name}'s Rooms`
                      : `All Rooms · ${rooms.length} total`}
                  </p>
                  {activeHK && (
                    <button onClick={() => setActiveHK(null)} className="text-[10px] font-mono text-cyber/60 hover:text-cyber transition-colors">
                      Show all →
                    </button>
                  )}
                </div>

                <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}>
                  {rooms
                    .filter((r) => !activeHK || assignments[r.roomNumber] === activeHK)
                    .map((room) => {
                      const cfg      = HK_STATUS[room.housekeepingStatus];
                      const isOOO    = room.availabilityStatus === 'OutOfOrder';
                      const hk       = STAFF.find((h) => h.id === assignments[room.roomNumber]);
                      const isSel    = selectedRoom === room.roomNumber;

                      return (
                        <button
                          key={room.roomNumber}
                          onClick={() => setSelectedRoom(isSel ? null : room.roomNumber)}
                          className={`room-card ${isOOO ? 'room-oos' : cfg.cardCls} relative ${isSel ? 'ring-2 ring-current ring-offset-1 ring-offset-space-950' : ''}`}
                          style={{ minHeight: 72 }}
                        >
                          <span className="text-[13px] font-mono font-bold">{room.roomNumber}</span>
                          <span className="text-[8px] font-mono opacity-60 uppercase">{isOOO ? 'OOO' : cfg.label}</span>
                          {hk && (
                            <span className={`text-[8px] font-mono font-bold ${hk.textCls} opacity-80`}>{hk.initials}</span>
                          )}
                        </button>
                      );
                    })}
                </div>

                {/* Unassigned pool */}
                {!activeHK && (() => {
                  const unassigned = rooms.filter((r) => !assignments[r.roomNumber]);
                  if (unassigned.length === 0) return null;
                  return (
                    <div className="mt-4">
                      <p className="text-[10px] font-mono text-neon-amber/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-neon-amber/70" />
                        Unassigned Pool · {unassigned.length} rooms
                      </p>
                      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}>
                        {unassigned.map((room) => {
                          const cfg = HK_STATUS[room.housekeepingStatus];
                          return (
                            <button
                              key={room.roomNumber}
                              onClick={() => setAssigningRoom(room.roomNumber)}
                              className={`room-card ${cfg.cardCls} opacity-60 border-dashed`}
                              style={{ minHeight: 72 }}
                              title="Click to assign"
                            >
                              <span className="text-[13px] font-mono font-bold">{room.roomNumber}</span>
                              <span className="text-[8px] font-mono opacity-60 uppercase">{cfg.label}</span>
                              <span className="text-[8px] opacity-40">+assign</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Right: room detail */}
              {selectedRoom && (() => {
                const room = roomMap[selectedRoom];
                if (!room) return null;
                const cfg  = HK_STATUS[room.housekeepingStatus];
                const hk   = STAFF.find((h) => h.id === assignments[room.roomNumber]);
                return (
                  <div className="w-56 flex-shrink-0">
                    <div className="card-cyber rounded-sm p-4 brackets space-y-4 animate-slide-in-left">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Room</p>
                          <p className="text-3xl font-mono font-bold text-cyber">{room.roomNumber}</p>
                        </div>
                        <span className={`badge ${cfg.badgeCls}`}>{cfg.label}</span>
                      </div>
                      <div className="cyber-divider" />
                      <div className="space-y-1.5 text-[11px] font-mono">
                        {[
                          { label: 'Type',     value: room.roomType },
                          { label: 'Floor',    value: room.floor },
                          { label: 'Zone',     value: room.zone ?? '—' },
                          { label: 'Occupancy',value: room.occupancyStatus },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between">
                            <span className="text-slate-600">{label}</span>
                            <span className="text-slate-300">{value}</span>
                          </div>
                        ))}
                        <div className="flex justify-between">
                          <span className="text-slate-600">Assigned To</span>
                          <span className={hk ? hk.textCls : 'text-slate-600'}>{hk?.name ?? 'Unassigned'}</span>
                        </div>
                      </div>
                      <div className="cyber-divider" />
                      {/* Assign controls */}
                      <div>
                        <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-2">Assign To</p>
                        <div className="flex flex-wrap gap-1">
                          {STAFF.map((h) => (
                            <button
                              key={h.id}
                              onClick={() => assignRoom(room.roomNumber, h.id)}
                              className={`text-[9px] font-mono font-bold px-2 py-1 rounded-sm border transition-all ${
                                assignments[room.roomNumber] === h.id
                                  ? `${h.bgCls} ${h.borderCls} ${h.textCls}`
                                  : 'border-space-600 text-slate-600 hover:border-space-500'
                              }`}
                            >
                              {h.initials}
                            </button>
                          ))}
                          {assignments[room.roomNumber] && (
                            <button
                              onClick={() => assignRoom(room.roomNumber, null)}
                              className="text-[9px] font-mono px-2 py-1 rounded-sm border border-space-600 text-slate-700 hover:text-neon-red hover:border-neon-red/30 transition-all"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      {cfg.nextStatus && (
                        <>
                          <div className="cyber-divider" />
                          <button
                            onClick={() => advance(room.roomNumber)}
                            className={`btn w-full justify-center text-[11px] ${
                              cfg.nextStatus === 'Ready' ? 'btn-success' :
                              cfg.nextStatus === 'Clean' ? 'btn-cyber' : 'btn-danger'
                            }`}
                          >
                            {cfg.nextLabel}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── BY FLOOR / ZONE ──────────────────────────────────────────── */}
        {viewMode === 'floor-zone' && (
          <div className="space-y-4">
            {floors.map((floor) => {
              const floorRooms = rooms.filter((r) => r.floor === floor);
              const zones = Array.from(new Set(floorRooms.map((r) => r.zone ?? 'General'))).sort();
              const floorDirty = floorRooms.filter((r) => r.housekeepingStatus === 'Dirty').length;
              const floorReady = floorRooms.filter((r) => r.housekeepingStatus === 'Ready').length;

              return (
                <div key={floor} className="card-cyber rounded-sm overflow-hidden">
                  {/* Floor header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-cyber/8 bg-space-900/40">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-sm bg-cyber/10 border border-cyber/20 flex items-center justify-center">
                        <span className="text-[11px] font-mono font-bold text-cyber">{floor}</span>
                      </div>
                      <div>
                        <span className="text-[12px] font-semibold text-slate-200">Floor {floor}</span>
                        <span className="text-[10px] font-mono text-slate-600 ml-3">{floorRooms.length} rooms · {zones.length} zone{zones.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {floorDirty > 0 && <span className="badge badge-red text-[9px]">{floorDirty} dirty</span>}
                      {floorReady > 0 && <span className="badge badge-green text-[9px]">{floorReady} ready</span>}
                    </div>
                  </div>

                  {/* Zones */}
                  <div className="p-4">
                    <div className={`grid gap-4 ${zones.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {zones.map((zone) => {
                        const zoneRooms = floorRooms.filter((r) => (r.zone ?? 'General') === zone);
                        return (
                          <div key={zone}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest">Zone {zone}</span>
                              <div className="flex-1 h-px bg-cyber/8" />
                              <span className="text-[9px] font-mono text-slate-700">{zoneRooms.length} rooms</span>
                            </div>
                            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))' }}>
                              {zoneRooms.map((room) => {
                                const cfg   = HK_STATUS[room.housekeepingStatus];
                                const isOOO = room.availabilityStatus === 'OutOfOrder';
                                const hk    = STAFF.find((h) => h.id === assignments[room.roomNumber]);
                                const isSel = selectedRoom === room.roomNumber;

                                return (
                                  <button
                                    key={room.roomNumber}
                                    onClick={() => setSelectedRoom(isSel ? null : room.roomNumber)}
                                    className={`room-card ${isOOO ? 'room-oos' : cfg.cardCls} ${isSel ? 'ring-2 ring-current ring-offset-1 ring-offset-space-950' : ''}`}
                                    style={{ minHeight: 64 }}
                                  >
                                    <span className="text-[12px] font-mono font-bold">{room.roomNumber}</span>
                                    <span className="text-[8px] font-mono opacity-60 uppercase">{isOOO ? 'OOO' : cfg.label}</span>
                                    {hk && <span className={`text-[8px] font-mono font-bold ${hk.textCls} opacity-80`}>{hk.initials}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Inline detail panel when a room is selected in floor/zone view */}
            {selectedRoom && (() => {
              const room = roomMap[selectedRoom];
              if (!room) return null;
              const cfg = HK_STATUS[room.housekeepingStatus];
              const hk  = STAFF.find((h) => h.id === assignments[room.roomNumber]);
              return (
                <div className="card-cyber rounded-sm p-5 brackets animate-slide-up">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <p className="text-2xl font-mono font-bold text-cyber">Room {room.roomNumber}</p>
                      <span className={`badge ${cfg.badgeCls}`}>{cfg.label}</span>
                      {hk && (
                        <span className={`text-[11px] font-mono font-bold ${hk.textCls}`}>→ {hk.name}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div>
                        <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-1">Assign To</p>
                        <div className="flex gap-1">
                          {STAFF.map((h) => (
                            <button
                              key={h.id}
                              onClick={() => assignRoom(room.roomNumber, h.id)}
                              className={`text-[9px] font-mono font-bold px-2 py-1 rounded-sm border transition-all ${
                                assignments[room.roomNumber] === h.id
                                  ? `${h.bgCls} ${h.borderCls} ${h.textCls}`
                                  : 'border-space-600 text-slate-600 hover:border-space-500'
                              }`}
                            >
                              {h.initials}
                            </button>
                          ))}
                          {assignments[room.roomNumber] && (
                            <button onClick={() => assignRoom(room.roomNumber, null)} className="text-[9px] font-mono px-2 py-1 rounded-sm border border-space-600 text-slate-700 hover:text-neon-red transition-all">✕</button>
                          )}
                        </div>
                      </div>
                      {cfg.nextStatus && (
                        <button
                          onClick={() => advance(room.roomNumber)}
                          className={`btn text-[11px] self-end ${
                            cfg.nextStatus === 'Ready' ? 'btn-success' :
                            cfg.nextStatus === 'Clean' ? 'btn-cyber' : 'btn-danger'
                          }`}
                        >
                          {cfg.nextLabel}
                        </button>
                      )}
                      <button onClick={() => setSelectedRoom(null)} className="btn btn-ghost self-end text-[10px]">✕ Close</button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Assign room modal ─────────────────────────────────────────── */}
        {assigningRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setAssigningRoom(null)}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative card-cyber rounded-sm p-6 w-80 brackets animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">Assign Room</p>
              <p className="text-2xl font-mono font-bold text-cyber mb-4">{assigningRoom}</p>
              <div className="cyber-divider mb-4" />
              <div className="space-y-2">
                {STAFF.map((hk) => {
                  const count = Object.values(assignments).filter((v) => v === hk.id).length;
                  return (
                    <button
                      key={hk.id}
                      onClick={() => assignRoom(assigningRoom, hk.id)}
                      className={`flex items-center gap-3 w-full p-3 rounded-sm border transition-all text-left ${hk.bgCls} ${hk.borderCls} hover:opacity-90`}
                    >
                      <div className={`w-8 h-8 rounded-sm ${hk.bgCls} border ${hk.borderCls} flex items-center justify-center`}>
                        <span className={`text-[10px] font-bold ${hk.textCls}`}>{hk.initials}</span>
                      </div>
                      <div className="flex-1">
                        <p className={`text-[12px] font-semibold ${hk.textCls}`}>{hk.name}</p>
                        <p className="text-[9px] font-mono text-slate-600">{count} rooms assigned</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setAssigningRoom(null)} className="btn btn-ghost w-full justify-center mt-3 text-[11px]">Cancel</button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function StaffIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}
function FloorIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  );
}
