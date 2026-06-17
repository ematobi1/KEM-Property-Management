'use client';

import { useState } from 'react';
import TopBar from '@/components/layout/TopBar';

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStatus = 'Active' | 'Paused' | 'Inactive';
type HookEvent = 'OnCheckIn' | 'OnCheckOut' | 'OnRoomStatusChange' | 'OnReservationCreate' | 'OnReservationCancel' | 'OnNightAudit';
type InstructionScope = 'Global' | 'Agent' | 'Skill' | 'Hook';

interface Skill {
  id: string;
  name: string;
  description: string;
  logic: Record<string, string>;
  agentCount: number;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  config: Record<string, string>;
  skillIds: string[];
  hooks: number;
}

interface Hook {
  id: string;
  name: string;
  event: HookEvent;
  method: string;
  isActive: boolean;
  isAsync: boolean;
  agentId: string | null;
}

interface Instruction {
  id: string;
  name: string;
  scope: InstructionScope;
  targetId: string | null;
  content: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_SKILLS: Skill[] = [
  { id: 's1', name: 'night-audit-reconcile', description: 'Runs end-of-day ledger reconciliation across all active folios and generates summary report', logic: { trigger: 'scheduled', schedule: '0 3 * * *', output: 'audit_report' }, agentCount: 1 },
  { id: 's2', name: 'deposit-verification',  description: 'Validates advance deposit status against reservation before check-in clearance is granted', logic: { check: 'deposit_status', allow_if: 'Paid', block_if: 'Pending' }, agentCount: 2 },
  { id: 's3', name: 'room-assignment-optimizer', description: 'Scores and ranks available rooms against guest tier, preferences, and floor balance', logic: { algorithm: 'weighted_score', factors: 'tier,floor,type', fallback: 'any_available' }, agentCount: 1 },
  { id: 's4', name: 'webhook-dispatch',       description: 'Serialises lifecycle event payload and dispatches to registered external webhook endpoints', logic: { retry: '3', backoff: 'exponential', timeout: '10000' }, agentCount: 2 },
  { id: 's5', name: 'no-show-escalation',    description: 'Flags reservations past check-in window and triggers automated no-show processing flow', logic: { window_minutes: '120', action: 'flag_and_notify', notify_role: 'FrontDeskAgent' }, agentCount: 1 },
  { id: 's6', name: 'report-generator',      description: 'Compiles occupancy, revenue, and housekeeping metrics into structured daily report', logic: { format: 'pdf', delivery: 'email', recipients: 'managers' }, agentCount: 1 },
];

const INITIAL_AGENTS: Agent[] = [
  { id: 'a1', name: 'Night Audit Engine',       description: 'Automated end-of-day reconciliation, folio balancing, and report generation', status: 'Active',   config: { run_at: '03:00', timezone: 'UTC', notify: 'admin@kem.com' }, skillIds: ['s1', 's6', 's4'], hooks: 2 },
  { id: 'a2', name: 'Deposit Validator',         description: 'Validates advance deposit status before arrival clearance is granted at check-in', status: 'Active',   config: { block_on_pending: 'true', notify_desk: 'true' }, skillIds: ['s2'], hooks: 1 },
  { id: 'a3', name: 'Webhook Dispatcher',        description: 'Handles outbound lifecycle event delivery to all registered external systems', status: 'Active',   config: { max_retries: '3', timeout_ms: '10000', log_level: 'info' }, skillIds: ['s4', 's2', 's6', 's3'], hooks: 5 },
  { id: 'a4', name: 'Housekeeping Optimizer',    description: 'AI-assisted room assignment scoring and workload balancing for housekeeping staff', status: 'Paused',  config: { algorithm: 'weighted', rebalance_interval: '30min' }, skillIds: ['s3', 's4'], hooks: 0 },
  { id: 'a5', name: 'No-Show Monitor',           description: 'Monitors arrivals past check-in window and triggers automated no-show processing', status: 'Active',   config: { check_interval: '15', window_minutes: '120' }, skillIds: ['s5'], hooks: 1 },
];

const INITIAL_HOOKS: Hook[] = [
  { id: 'h1', name: 'on-checkin-notify',       event: 'OnCheckIn',           method: 'POST', isActive: true,  isAsync: true,  agentId: 'a3' },
  { id: 'h2', name: 'on-checkout-pms-sync',    event: 'OnCheckOut',          method: 'POST', isActive: true,  isAsync: false, agentId: 'a3' },
  { id: 'h3', name: 'on-room-ready-alert',     event: 'OnRoomStatusChange',  method: 'POST', isActive: true,  isAsync: true,  agentId: 'a3' },
  { id: 'h4', name: 'on-night-audit-report',   event: 'OnNightAudit',        method: 'POST', isActive: false, isAsync: true,  agentId: 'a1' },
  { id: 'h5', name: 'on-reservation-created',  event: 'OnReservationCreate', method: 'POST', isActive: true,  isAsync: true,  agentId: 'a3' },
  { id: 'h6', name: 'on-no-show-flag',         event: 'OnReservationCancel', method: 'POST', isActive: true,  isAsync: true,  agentId: 'a5' },
];

const INITIAL_INSTRUCTIONS: Instruction[] = [
  {
    id: 'i1', name: 'Global Tone & Safety Policy', scope: 'Global', targetId: null, priority: 1, isActive: true, createdAt: '2026-06-01',
    content: 'All agent responses and automated actions must adhere to KEM PMS operational standards. Never expose guest PII in logs or webhook payloads. Mask all names to first-initial format before transmission. Escalate any anomaly to the FrontDeskAgent role.',
  },
  {
    id: 'i2', name: 'Night Audit Reconciliation Rules', scope: 'Agent', targetId: 'a1', priority: 1, isActive: true, createdAt: '2026-06-03',
    content: 'Begin reconciliation only after 03:00 UTC. If folio balance discrepancy exceeds $500, flag for manual review and do not auto-post. Generate PDF report and email to all Manager-role users. Retry up to 3 times on DB timeout before alerting on-call.',
  },
  {
    id: 'i3', name: 'Deposit Block Messaging', scope: 'Skill', targetId: 's2', priority: 2, isActive: true, createdAt: '2026-06-05',
    content: 'When blocking check-in due to pending deposit, surface the message: "Advance deposit not confirmed. Please contact the front desk." Do not expose internal deposit reference IDs in the guest-facing message. Log the reservation ID and timestamp for audit.',
  },
  {
    id: 'i4', name: 'Webhook Retry Behaviour', scope: 'Agent', targetId: 'a3', priority: 1, isActive: true, createdAt: '2026-06-07',
    content: 'Use exponential backoff starting at 1s, doubling up to 32s. After 3 failed attempts, enqueue the event to the dead-letter queue and send an internal Slack alert. Never discard events silently. Always include the correlation ID from the original request in retry attempts.',
  },
  {
    id: 'i5', name: 'No-Show Escalation Hold', scope: 'Agent', targetId: 'a5', priority: 2, isActive: false, createdAt: '2026-06-10',
    content: 'DISABLED — holiday override: Do not auto-process no-shows during public holiday periods. Flag reservations for manual review by a Manager-role user before any status change. This instruction takes precedence over the default 120-minute window rule.',
  },
  {
    id: 'i6', name: 'Webhook Payload Sanitisation', scope: 'Hook', targetId: 'h1', priority: 1, isActive: true, createdAt: '2026-06-12',
    content: 'Strip all fields matching /guest(First|Last)Name|email|phone/ from the outbound payload before dispatch. Replace with masked equivalents: guestRef (first char + asterisks). Include propertyId, confirmationNumber, roomNumber, and eventTimestamp only.',
  },
];

type Tab = 'agents' | 'skills' | 'hooks' | 'instructions';


// ─── Page ────────────────────────────────────────────────────────────────────

export default function ExtensionsPage() {
  const [tab, setTab]                 = useState<'agents' | 'skills' | 'hooks' | 'instructions'>('agents');
  const [agents, setAgents]           = useState<Agent[]>(INITIAL_AGENTS);
  const [skills, setSkills]           = useState<Skill[]>(INITIAL_SKILLS);
  const [hooks, setHooks]             = useState<Hook[]>(INITIAL_HOOKS);
  const [instructions, setInstructions] = useState<Instruction[]>(INITIAL_INSTRUCTIONS);

  const [selectedAgent, setSelectedAgent]           = useState<Agent | null>(null);
  const [selectedSkill, setSelectedSkill]           = useState<Skill | null>(null);
  const [selectedInstruction, setSelectedInstruction] = useState<Instruction | null>(null);
  const [agentModal, setAgentModal]                 = useState(false);
  const [skillModal, setSkillModal]                 = useState(false);
  const [hookModal, setHookModal]                   = useState(false);
  const [instructionModal, setInstructionModal]     = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<Instruction | null>(null);

  function toggleAgentStatus(id: string) {
    setAgents((prev) =>
      prev.map((a) =>
        a.id !== id ? a : { ...a, status: a.status === 'Active' ? 'Paused' : 'Active' }
      )
    );
    if (selectedAgent?.id === id) {
      setSelectedAgent((prev) =>
        prev ? { ...prev, status: prev.status === 'Active' ? 'Paused' : 'Active' } : prev
      );
    }
  }

  function deleteAgent(id: string) {
    setAgents((prev) => prev.filter((a) => a.id !== id));
    if (selectedAgent?.id === id) setSelectedAgent(null);
  }

  function deleteSkill(id: string) {
    setSkills((prev) => prev.filter((s) => s.id !== id));
    if (selectedSkill?.id === id) setSelectedSkill(null);
  }

  function addAgent(name: string, description: string, status: AgentStatus) {
    const newAgent: Agent = {
      id: `a${Date.now()}`,
      name,
      description,
      status,
      config: {},
      skillIds: [],
      hooks: 0,
    };
    setAgents((prev) => [newAgent, ...prev]);
  }

  function addSkill(name: string, description: string) {
    const newSkill: Skill = {
      id: `s${Date.now()}`,
      name: name.toLowerCase().replace(/\s+/g, '-'),
      description,
      logic: {},
      agentCount: 0,
    };
    setSkills((prev) => [newSkill, ...prev]);
  }

  function toggleHook(id: string) {
    setHooks((prev) => prev.map((h) => h.id === id ? { ...h, isActive: !h.isActive } : h));
  }

  function toggleInstruction(id: string) {
    setInstructions((prev) => prev.map((i) => i.id === id ? { ...i, isActive: !i.isActive } : i));
    if (selectedInstruction?.id === id)
      setSelectedInstruction((prev) => prev ? { ...prev, isActive: !prev.isActive } : prev);
  }

  function deleteInstruction(id: string) {
    setInstructions((prev) => prev.filter((i) => i.id !== id));
    if (selectedInstruction?.id === id) setSelectedInstruction(null);
  }

  function saveInstruction(inst: Instruction) {
    setInstructions((prev) => {
      const idx = prev.findIndex((i) => i.id === inst.id);
      if (idx === -1) return [inst, ...prev];
      return prev.map((i) => i.id === inst.id ? inst : i);
    });
    setSelectedInstruction(inst);
  }

  const activeAgents        = agents.filter((a) => a.status === 'Active').length;
  const activeHooks         = hooks.filter((h) => h.isActive).length;
  const activeInstructions  = instructions.filter((i) => i.isActive).length;

  return (
    <>
      <TopBar
        title="Extensions"
        subtitle="Automation Engine"
        actions={
          <div className="flex gap-2">
            <span className="badge badge-green">{activeAgents} Active Agents</span>
            <span className="badge badge-cyan">{skills.length} Skills</span>
            <span className="badge badge-purple">{activeHooks} Active Hooks</span>
            <span className="badge badge-amber">{activeInstructions} Instructions</span>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-5 animate-fade-in">

        {/* ── Tab bar ──────────────────────────────────────────────────── */}
        <div className="flex gap-1 border-b border-cyber/10">
          {(['agents', 'skills', 'hooks', 'instructions'] as const).map((t) => {
            const counts = { agents: agents.length, skills: skills.length, hooks: hooks.length, instructions: instructions.length };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 pb-3 text-xs font-mono font-bold uppercase tracking-widest transition-all border-b-2 -mb-px flex items-center gap-2 ${
                  tab === t ? 'text-cyber border-cyber' : 'text-slate-600 border-transparent hover:text-slate-400'
                }`}
              >
                {t}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-bold ${
                  tab === t ? 'bg-cyber/20 text-cyber' : 'bg-space-700 text-slate-600'
                }`}>
                  {counts[t]}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Agents tab ───────────────────────────────────────────────── */}
        {tab === 'agents' && (
          <div className="flex gap-5">

            {/* Agent list */}
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                  {agents.length} registered agents
                </p>
                <button onClick={() => setAgentModal(true)} className="btn btn-cyber text-[11px]">
                  <PlusIcon /> New Agent
                </button>
              </div>

              {agents.map((agent) => {
                const agentSkills = skills.filter((s) => agent.skillIds.includes(s.id));
                const isSelected  = selectedAgent?.id === agent.id;
                return (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(isSelected ? null : agent)}
                    className={`card-cyber rounded-sm p-4 brackets cursor-pointer transition-all ${
                      isSelected ? 'border-cyber/40 shadow-cyber' : 'hover:border-cyber/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0 border ${
                        agent.status === 'Active'
                          ? 'bg-neon-purple/10 border-neon-purple/25'
                          : 'bg-space-700 border-space-600'
                      }`}>
                        <AgentIcon color={agent.status === 'Active' ? '#A78BFA' : '#3D5A80'} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-semibold text-slate-100">{agent.name}</h3>
                          <StatusBadge status={agent.status} />
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{agent.description}</p>

                        {/* Skill chips */}
                        {agentSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {agentSkills.map((s) => (
                              <span key={s.id} className="text-[9px] font-mono bg-neon-purple/8 border border-neon-purple/15 text-neon-purple/70 px-2 py-0.5 rounded-sm">
                                {s.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 flex-shrink-0 ml-2">
                        <div className="text-center">
                          <p className="text-base font-mono font-bold text-neon-purple leading-none">{agent.skillIds.length}</p>
                          <p className="text-[9px] font-mono text-slate-600 mt-0.5">SKILLS</p>
                        </div>
                        <div className="text-center">
                          <p className="text-base font-mono font-bold text-cyber leading-none">{agent.hooks}</p>
                          <p className="text-[9px] font-mono text-slate-600 mt-0.5">HOOKS</p>
                        </div>
                        {/* Actions */}
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleAgentStatus(agent.id)}
                            className={`btn py-1 px-2 text-[10px] ${agent.status === 'Active' ? 'btn-ghost' : 'btn-success'}`}
                            title={agent.status === 'Active' ? 'Pause agent' : 'Activate agent'}
                          >
                            {agent.status === 'Active' ? <PauseIcon /> : <PlayIcon />}
                          </button>
                          <button
                            onClick={() => deleteAgent(agent.id)}
                            className="btn btn-danger py-1 px-2 text-[10px]"
                            title="Delete agent"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Agent detail panel */}
            {selectedAgent && (
              <AgentDetailPanel
                agent={selectedAgent}
                skills={skills}
                hooks={hooks}
                onClose={() => setSelectedAgent(null)}
                onToggleStatus={() => toggleAgentStatus(selectedAgent.id)}
              />
            )}
          </div>
        )}

        {/* ── Skills tab ───────────────────────────────────────────────── */}
        {tab === 'skills' && (
          <div className="flex gap-5">

            {/* Skills list */}
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                  {skills.length} atomic skills
                </p>
                <button onClick={() => setSkillModal(true)} className="btn btn-cyber text-[11px]">
                  <PlusIcon /> New Skill
                </button>
              </div>

              <div className="grid gap-3">
                {skills.map((skill) => {
                  const isSelected = selectedSkill?.id === skill.id;
                  const assignedAgents = agents.filter((a) => a.skillIds.includes(skill.id));
                  return (
                    <div
                      key={skill.id}
                      onClick={() => setSelectedSkill(isSelected ? null : skill)}
                      className={`card-cyber rounded-sm p-4 brackets cursor-pointer transition-all ${
                        isSelected ? 'border-neon-green/40 shadow-neon-green' : 'hover:border-neon-green/15'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-sm bg-neon-green/8 border border-neon-green/20 flex items-center justify-center flex-shrink-0">
                          <SkillIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <span className="font-mono text-[12px] font-bold text-neon-green/90">{skill.name}</span>
                            <span className="badge badge-green text-[9px]">
                              {assignedAgents.length} agent{assignedAgents.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{skill.description}</p>

                          {/* Logic preview */}
                          {Object.keys(skill.logic).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {Object.entries(skill.logic).map(([k, v]) => (
                                <span key={k} className="font-mono text-[9px] text-slate-600 bg-space-800 border border-space-600 px-2 py-0.5 rounded-sm">
                                  <span className="text-slate-500">{k}:</span> <span className="text-slate-400">{v}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Assigned agents */}
                        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          {assignedAgents.length > 0 && (
                            <div className="flex -space-x-1">
                              {assignedAgents.slice(0, 3).map((a) => (
                                <div key={a.id} title={a.name} className="w-6 h-6 rounded-sm bg-neon-purple/15 border border-neon-purple/25 flex items-center justify-center text-[8px] font-bold text-neon-purple">
                                  {a.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                                </div>
                              ))}
                              {assignedAgents.length > 3 && (
                                <div className="w-6 h-6 rounded-sm bg-space-700 border border-space-600 flex items-center justify-center text-[8px] text-slate-500">
                                  +{assignedAgents.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                          <button
                            onClick={() => deleteSkill(skill.id)}
                            className="btn btn-danger py-1 px-2 text-[10px]"
                            title="Delete skill"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Skill detail panel */}
            {selectedSkill && (
              <SkillDetailPanel
                skill={selectedSkill}
                agents={agents.filter((a) => a.skillIds.includes(selectedSkill.id))}
                onClose={() => setSelectedSkill(null)}
              />
            )}
          </div>
        )}

        {/* ── Hooks tab ────────────────────────────────────────────────── */}
        {tab === 'hooks' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                {hooks.length} registered hooks · {activeHooks} active
              </p>
              <button onClick={() => setHookModal(true)} className="btn btn-cyber text-[11px]">
                <PlusIcon /> New Hook
              </button>
            </div>

            <div className="card-cyber rounded-sm overflow-hidden">
              <table className="pms-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Event</th>
                    <th>Agent</th>
                    <th>Method</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {hooks.map((h) => {
                    const agent = agents.find((a) => a.id === h.agentId);
                    return (
                      <tr key={h.id}>
                        <td><span className="font-mono text-[11px] text-cyber/80">{h.name}</span></td>
                        <td><span className="badge badge-purple text-[9px]">{h.event}</span></td>
                        <td>
                          {agent ? (
                            <span className="text-[11px] text-slate-400 font-medium">{agent.name}</span>
                          ) : (
                            <span className="text-slate-700 text-[10px]">—</span>
                          )}
                        </td>
                        <td><span className="font-mono text-[10px] px-2 py-0.5 rounded-sm bg-space-700 border border-space-600 text-slate-400">{h.method}</span></td>
                        <td>
                          {h.isAsync
                            ? <span className="badge badge-cyan">Async</span>
                            : <span className="badge badge-amber">Sync</span>}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <span className={`status-dot ${h.isActive ? 'dot-green' : 'dot-gray'}`} style={{ width: 6, height: 6 }} />
                            <span className={`text-[10px] font-mono ${h.isActive ? 'text-neon-green' : 'text-slate-600'}`}>
                              {h.isActive ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => toggleHook(h.id)}
                            className={`btn py-1 px-2 text-[10px] ${h.isActive ? 'btn-danger' : 'btn-success'}`}
                          >
                            {h.isActive ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

        {/* ── Instructions tab ─────────────────────────────────────────── */}
        {tab === 'instructions' && (
          <div className="flex gap-5">

            {/* List */}
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                  {instructions.length} instructions · {activeInstructions} active
                </p>
                <button
                  onClick={() => { setEditingInstruction(null); setInstructionModal(true); }}
                  className="btn btn-cyber text-[11px]"
                >
                  <PlusIcon /> New Instruction
                </button>
              </div>

              {/* Scope legend */}
              <div className="flex gap-2 flex-wrap">
                {(['Global', 'Agent', 'Skill', 'Hook'] as InstructionScope[]).map((s) => {
                  const cfg = SCOPE_CONFIG[s];
                  return (
                    <div key={s} className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      <span className="text-[9px] font-mono text-slate-600">{s}</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                {instructions.map((inst) => {
                  const cfg       = SCOPE_CONFIG[inst.scope];
                  const isSelected = selectedInstruction?.id === inst.id;
                  const target    = resolveTarget(inst, agents, skills, hooks);
                  return (
                    <div
                      key={inst.id}
                      onClick={() => setSelectedInstruction(isSelected ? null : inst)}
                      className={`card-cyber rounded-sm p-4 cursor-pointer transition-all ${
                        isSelected ? 'border-neon-amber/40 shadow-neon-amber' : 'hover:border-neon-amber/15'
                      } ${!inst.isActive ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Priority + scope dot */}
                        <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
                          <span className={`text-[10px] font-mono font-bold w-5 h-5 rounded-sm flex items-center justify-center border ${cfg.border} ${cfg.text} ${cfg.bg}`}>
                            {inst.priority}
                          </span>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold text-slate-100">{inst.name}</span>
                            <span className={`badge text-[9px] ${cfg.badge}`}>{inst.scope}</span>
                            {target && (
                              <span className="text-[9px] font-mono text-slate-600 bg-space-800 border border-space-600 px-2 py-0.5 rounded-sm">
                                → {target}
                              </span>
                            )}
                            {!inst.isActive && (
                              <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">disabled</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{inst.content}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setEditingInstruction(inst); setInstructionModal(true); }}
                            className="btn btn-ghost py-1 px-2 text-[10px]"
                            title="Edit instruction"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => toggleInstruction(inst.id)}
                            className={`btn py-1 px-2 text-[10px] ${inst.isActive ? 'btn-ghost' : 'btn-success'}`}
                            title={inst.isActive ? 'Disable' : 'Enable'}
                          >
                            {inst.isActive ? <PauseIcon /> : <PlayIcon />}
                          </button>
                          <button
                            onClick={() => deleteInstruction(inst.id)}
                            className="btn btn-danger py-1 px-2 text-[10px]"
                            title="Delete instruction"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detail panel */}
            {selectedInstruction && (
              <InstructionDetailPanel
                instruction={selectedInstruction}
                agents={agents}
                skills={skills}
                hooks={hooks}
                onClose={() => setSelectedInstruction(null)}
                onToggle={() => toggleInstruction(selectedInstruction.id)}
                onEdit={() => { setEditingInstruction(selectedInstruction); setInstructionModal(true); }}
              />
            )}
          </div>
        )}

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {agentModal && (
        <NewAgentModal
          onClose={() => setAgentModal(false)}
          onCreate={addAgent}
        />
      )}
      {skillModal && (
        <NewSkillModal
          onClose={() => setSkillModal(false)}
          onCreate={addSkill}
        />
      )}
      {hookModal && (
        <NewHookModal
          agents={agents}
          onClose={() => setHookModal(false)}
          onCreate={(h) => setHooks((prev) => [h, ...prev])}
        />
      )}
      {instructionModal && (
        <InstructionModal
          agents={agents}
          skills={skills}
          hooks={hooks}
          initial={editingInstruction}
          onClose={() => { setInstructionModal(false); setEditingInstruction(null); }}
          onSave={saveInstruction}
        />
      )}
    </>
  );
}

// ─── Instruction helpers ──────────────────────────────────────────────────────

const SCOPE_CONFIG: Record<InstructionScope, { dot: string; bg: string; border: string; text: string; badge: string }> = {
  Global: { dot: 'bg-neon-amber',   bg: 'bg-neon-amber/10',   border: 'border-neon-amber/30',   text: 'text-neon-amber',   badge: 'badge-amber' },
  Agent:  { dot: 'bg-neon-purple',  bg: 'bg-neon-purple/10',  border: 'border-neon-purple/30',  text: 'text-neon-purple',  badge: 'badge-purple' },
  Skill:  { dot: 'bg-neon-green',   bg: 'bg-neon-green/10',   border: 'border-neon-green/30',   text: 'text-neon-green',   badge: 'badge-green' },
  Hook:   { dot: 'bg-cyber',        bg: 'bg-cyber/10',         border: 'border-cyber/30',        text: 'text-cyber',        badge: 'badge-cyan' },
};

function resolveTarget(inst: Instruction, agents: Agent[], skills: Skill[], hooks: Hook[]): string | null {
  if (!inst.targetId) return null;
  if (inst.scope === 'Agent')  return agents.find((a) => a.id === inst.targetId)?.name ?? inst.targetId;
  if (inst.scope === 'Skill')  return skills.find((s) => s.id === inst.targetId)?.name ?? inst.targetId;
  if (inst.scope === 'Hook')   return hooks.find((h)  => h.id === inst.targetId)?.name ?? inst.targetId;
  return null;
}

// ─── Instruction Detail Panel ─────────────────────────────────────────────────

function InstructionDetailPanel({
  instruction: inst, agents, skills, hooks, onClose, onToggle, onEdit,
}: {
  instruction: Instruction;
  agents: Agent[];
  skills: Skill[];
  hooks: Hook[];
  onClose: () => void;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const cfg    = SCOPE_CONFIG[inst.scope];
  const target = resolveTarget(inst, agents, skills, hooks);

  return (
    <div className="w-80 flex-shrink-0 space-y-3 animate-slide-in-left">
      <div className="card-cyber rounded-sm p-4 brackets">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Instruction Detail</span>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors"><CloseIcon /></button>
        </div>
        <div className="cyber-divider mb-3" />

        <div className="flex items-start gap-2 mb-3">
          <div className={`w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 border ${cfg.border} ${cfg.bg}`}>
            <InstructionIcon color={inst.scope === 'Global' ? '#FBB040' : inst.scope === 'Agent' ? '#A78BFA' : inst.scope === 'Skill' ? '#00E5A0' : '#00CFFF'} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100 leading-tight">{inst.name}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={`badge text-[9px] ${cfg.badge}`}>{inst.scope}</span>
              {target && <span className="text-[9px] font-mono text-slate-600">→ {target}</span>}
              <span className={`text-[9px] font-mono ${inst.isActive ? 'text-neon-green' : 'text-slate-600'}`}>
                {inst.isActive ? '● Active' : '○ Disabled'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-1.5">
          <button onClick={onEdit} className="btn btn-ghost flex-1 justify-center text-[10px]">
            <EditIcon /> Edit
          </button>
          <button onClick={onToggle} className={`btn flex-1 justify-center text-[10px] ${inst.isActive ? 'btn-ghost' : 'btn-success'}`}>
            {inst.isActive ? <><PauseIcon /> Disable</> : <><PlayIcon /> Enable</>}
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="card-cyber rounded-sm p-4">
        <p className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-2">Metadata</p>
        <div className="space-y-1.5">
          {[
            { k: 'Priority', v: String(inst.priority) },
            { k: 'Scope',    v: inst.scope },
            { k: 'Target',   v: target ?? '(global)' },
            { k: 'Created',  v: inst.createdAt },
          ].map(({ k, v }) => (
            <div key={k} className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-600">{k}</span>
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-sm border ${cfg.border} ${cfg.bg} ${cfg.text}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Full content */}
      <div className="card-cyber rounded-sm p-4">
        <p className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-2">Instruction Content</p>
        <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">{inst.content}</p>
      </div>
    </div>
  );
}

// ─── Instruction Modal ────────────────────────────────────────────────────────

function InstructionModal({
  agents, skills, hooks, initial, onClose, onSave,
}: {
  agents: Agent[];
  skills: Skill[];
  hooks: Hook[];
  initial: Instruction | null;
  onClose: () => void;
  onSave: (inst: Instruction) => void;
}) {
  const [name, setName]       = useState(initial?.name ?? '');
  const [scope, setScope]     = useState<InstructionScope>(initial?.scope ?? 'Global');
  const [targetId, setTarget] = useState<string>(initial?.targetId ?? '');
  const [priority, setPriority] = useState(String(initial?.priority ?? '1'));
  const [content, setContent] = useState(initial?.content ?? '');
  const [isActive, setActive] = useState(initial?.isActive ?? true);

  const targetOptions: { id: string; label: string }[] = scope === 'Agent'
    ? agents.map((a) => ({ id: a.id, label: a.name }))
    : scope === 'Skill'
    ? skills.map((s) => ({ id: s.id, label: s.name }))
    : scope === 'Hook'
    ? hooks.map((h) => ({ id: h.id, label: h.name }))
    : [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    onSave({
      id:        initial?.id ?? `i${Date.now()}`,
      name:      name.trim(),
      scope,
      targetId:  scope === 'Global' ? null : targetId || null,
      priority:  Math.max(1, Math.min(10, parseInt(priority, 10) || 1)),
      content:   content.trim(),
      isActive,
      createdAt: initial?.createdAt ?? new Date().toISOString().split('T')[0],
    });
    onClose();
  }

  const cfg = SCOPE_CONFIG[scope];

  return (
    <Modal title={initial ? 'Edit Instruction' : 'New Instruction'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className="pms-input" placeholder="e.g. Deposit Block Messaging" required />
        </Field>

        <Field label="Scope">
          <div className="grid grid-cols-4 gap-1">
            {(['Global', 'Agent', 'Skill', 'Hook'] as InstructionScope[]).map((s) => (
              <button
                type="button" key={s}
                onClick={() => { setScope(s); setTarget(''); }}
                className={`btn text-[10px] py-1.5 justify-center border transition-all ${
                  scope === s
                    ? `${SCOPE_CONFIG[s].bg} ${SCOPE_CONFIG[s].border} ${SCOPE_CONFIG[s].text}`
                    : 'btn-ghost'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>

        {scope !== 'Global' && (
          <Field label={`Target ${scope}`}>
            <select value={targetId} onChange={(e) => setTarget(e.target.value)} className="pms-input">
              <option value="">— Select {scope} —</option>
              {targetOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority (1–10)">
            <input
              type="number" min={1} max={10} value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={`pms-input font-mono ${cfg.text}`}
            />
          </Field>
          <Field label="Status">
            <div className="flex gap-1 h-[38px]">
              <button type="button" onClick={() => setActive(true)}
                className={`btn flex-1 justify-center text-[10px] ${isActive ? 'btn-success' : 'btn-ghost'}`}>Active</button>
              <button type="button" onClick={() => setActive(false)}
                className={`btn flex-1 justify-center text-[10px] ${!isActive ? 'btn-ghost border-slate-600 text-slate-500' : 'btn-ghost'}`}>Disabled</button>
            </div>
          </Field>
        </div>

        <Field label="Instruction Content">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="pms-input resize-none font-mono text-[11px] leading-relaxed"
            rows={6}
            placeholder="Write the directive this instruction enforces. Be specific — agents follow this literally."
            required
          />
          <p className="text-[9px] font-mono text-slate-700 mt-1">{content.length} chars</p>
        </Field>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1 justify-center">Cancel</button>
          <button type="submit" className="btn btn-solid-cyber flex-1 justify-center">
            {initial ? 'Save Changes' : 'Create Instruction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Agent Detail Panel ───────────────────────────────────────────────────────

function AgentDetailPanel({
  agent, skills, hooks, onClose, onToggleStatus,
}: {
  agent: Agent;
  skills: Skill[];
  hooks: Hook[];
  onClose: () => void;
  onToggleStatus: () => void;
}) {
  const agentSkills = skills.filter((s) => agent.skillIds.includes(s.id));
  const agentHooks  = hooks.filter((h) => h.agentId === agent.id);

  return (
    <div className="w-72 flex-shrink-0 space-y-3 animate-slide-in-left">
      <div className="card-cyber rounded-sm p-4 brackets">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Agent Detail</span>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
            <CloseIcon />
          </button>
        </div>
        <div className="cyber-divider mb-3" />

        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-sm bg-neon-purple/10 border border-neon-purple/25 flex items-center justify-center">
            <AgentIcon color="#A78BFA" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100 leading-tight">{agent.name}</p>
            <StatusBadge status={agent.status} />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{agent.description}</p>

        <button
          onClick={onToggleStatus}
          className={`btn w-full justify-center mt-3 text-[11px] ${agent.status === 'Active' ? 'btn-ghost' : 'btn-success'}`}
        >
          {agent.status === 'Active' ? <><PauseIcon /> Pause Agent</> : <><PlayIcon /> Activate Agent</>}
        </button>
      </div>

      {/* Config */}
      {Object.keys(agent.config).length > 0 && (
        <div className="card-cyber rounded-sm p-4">
          <p className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-2">Config</p>
          <div className="space-y-1.5">
            {Object.entries(agent.config).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-slate-600">{k}</span>
                <span className="font-mono text-[10px] text-slate-400 bg-space-800 px-2 py-0.5 rounded-sm border border-space-600">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned skills */}
      <div className="card-cyber rounded-sm p-4">
        <p className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-2">
          Skills <span className="text-neon-purple">{agentSkills.length}</span>
        </p>
        {agentSkills.length === 0 ? (
          <p className="text-[10px] text-slate-700 font-mono">No skills assigned</p>
        ) : (
          <div className="space-y-1.5">
            {agentSkills.map((s) => (
              <div key={s.id} className="flex items-center gap-2 p-1.5 rounded-sm bg-neon-purple/5 border border-neon-purple/10">
                <SkillIcon size={11} />
                <span className="font-mono text-[10px] text-neon-purple/80">{s.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hooks */}
      <div className="card-cyber rounded-sm p-4">
        <p className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-2">
          Hooks <span className="text-cyber">{agentHooks.length}</span>
        </p>
        {agentHooks.length === 0 ? (
          <p className="text-[10px] text-slate-700 font-mono">No hooks bound</p>
        ) : (
          <div className="space-y-1.5">
            {agentHooks.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-1.5 rounded-sm bg-cyber/4 border border-cyber/8">
                <span className="font-mono text-[9px] text-slate-500 truncate">{h.name}</span>
                <span className={`status-dot ${h.isActive ? 'dot-green' : 'dot-gray'} flex-shrink-0`} style={{ width: 6, height: 6 }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Skill Detail Panel ───────────────────────────────────────────────────────

function SkillDetailPanel({
  skill, agents, onClose,
}: {
  skill: Skill;
  agents: Agent[];
  onClose: () => void;
}) {
  return (
    <div className="w-72 flex-shrink-0 space-y-3 animate-slide-in-left">
      <div className="card-cyber rounded-sm p-4 brackets">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Skill Detail</span>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors"><CloseIcon /></button>
        </div>
        <div className="cyber-divider mb-3" />

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-sm bg-neon-green/8 border border-neon-green/20 flex items-center justify-center">
            <SkillIcon />
          </div>
          <p className="font-mono text-[12px] font-bold text-neon-green/90">{skill.name}</p>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">{skill.description}</p>
      </div>

      {/* Logic */}
      {Object.keys(skill.logic).length > 0 && (
        <div className="card-cyber rounded-sm p-4">
          <p className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-2">Logic Parameters</p>
          <div className="space-y-1.5">
            {Object.entries(skill.logic).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-slate-600">{k}</span>
                <span className="font-mono text-[10px] text-neon-green/70 bg-neon-green/5 border border-neon-green/10 px-2 py-0.5 rounded-sm">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned agents */}
      <div className="card-cyber rounded-sm p-4">
        <p className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-2">
          Assigned To <span className="text-neon-purple">{agents.length}</span>
        </p>
        {agents.length === 0 ? (
          <p className="text-[10px] text-slate-700 font-mono">Not assigned to any agents</p>
        ) : (
          <div className="space-y-1.5">
            {agents.map((a) => (
              <div key={a.id} className="flex items-center gap-2 p-1.5 rounded-sm bg-neon-purple/5 border border-neon-purple/10">
                <AgentIcon color="#A78BFA" size={11} />
                <span className="text-[10px] text-slate-400 flex-1 truncate">{a.name}</span>
                <StatusBadge status={a.status} tiny />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function NewAgentModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, desc: string, status: AgentStatus) => void }) {
  const [name, setName]         = useState('');
  const [desc, setDesc]         = useState('');
  const [status, setStatus]     = useState<AgentStatus>('Active');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), desc.trim(), status);
    onClose();
  }

  return (
    <Modal title="New Agent" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Agent Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className="pms-input" placeholder="e.g. Rate Optimizer" required />
        </Field>
        <Field label="Description">
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="pms-input resize-none" rows={3} placeholder="What does this agent do?" />
        </Field>
        <Field label="Initial Status">
          <div className="flex gap-2">
            {(['Active', 'Paused', 'Inactive'] as AgentStatus[]).map((s) => (
              <button type="button" key={s} onClick={() => setStatus(s)}
                className={`flex-1 btn text-[10px] py-1.5 ${status === s ? 'btn-solid-cyber' : 'btn-ghost'}`}>
                {s}
              </button>
            ))}
          </div>
        </Field>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1 justify-center">Cancel</button>
          <button type="submit" className="btn btn-solid-cyber flex-1 justify-center">Create Agent</button>
        </div>
      </form>
    </Modal>
  );
}

function NewSkillModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, desc: string) => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), desc.trim());
    onClose();
  }

  return (
    <Modal title="New Skill" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Skill Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className="pms-input" placeholder="e.g. rate-optimizer" required />
        </Field>
        <Field label="Description">
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="pms-input resize-none" rows={3} placeholder="What capability does this skill provide?" />
        </Field>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1 justify-center">Cancel</button>
          <button type="submit" className="btn btn-solid-cyber flex-1 justify-center">Create Skill</button>
        </div>
      </form>
    </Modal>
  );
}

function NewHookModal({ agents, onClose, onCreate }: { agents: Agent[]; onClose: () => void; onCreate: (h: Hook) => void }) {
  const [name, setName]     = useState('');
  const [event, setEvent]   = useState<HookEvent>('OnCheckIn');
  const [agentId, setAgentId] = useState<string>('');
  const [isAsync, setIsAsync] = useState(true);

  const EVENTS: HookEvent[] = ['OnCheckIn', 'OnCheckOut', 'OnRoomStatusChange', 'OnReservationCreate', 'OnReservationCancel', 'OnNightAudit'];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ id: `h${Date.now()}`, name: name.trim(), event, method: 'POST', isActive: true, isAsync, agentId: agentId || null });
    onClose();
  }

  return (
    <Modal title="New Hook" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Hook Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className="pms-input font-mono" placeholder="on-event-action" required />
        </Field>
        <Field label="Event">
          <select value={event} onChange={(e) => setEvent(e.target.value as HookEvent)} className="pms-input">
            {EVENTS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
          </select>
        </Field>
        <Field label="Bind to Agent (optional)">
          <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="pms-input">
            <option value="">— No agent —</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <Field label="Execution Mode">
          <div className="flex gap-2">
            {[true, false].map((v) => (
              <button type="button" key={String(v)} onClick={() => setIsAsync(v)}
                className={`flex-1 btn text-[10px] py-1.5 ${isAsync === v ? 'btn-solid-cyber' : 'btn-ghost'}`}>
                {v ? 'Async' : 'Sync'}
              </button>
            ))}
          </div>
        </Field>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1 justify-center">Cancel</button>
          <button type="submit" className="btn btn-solid-cyber flex-1 justify-center">Register Hook</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative card-cyber rounded-sm p-6 w-full max-w-md brackets animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
            <p className="text-[10px] font-mono text-cyber/50 mt-0.5">KEM EXTENSIONS ENGINE</p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors"><CloseIcon /></button>
        </div>
        <div className="cyber-divider mb-5" />
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function StatusBadge({ status, tiny }: { status: AgentStatus; tiny?: boolean }) {
  const map: Record<AgentStatus, string> = { Active: 'badge-green', Paused: 'badge-amber', Inactive: 'badge-gray' };
  return <span className={`badge ${map[status]} ${tiny ? 'text-[8px] py-0 px-1' : ''}`}>{status}</span>;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function AgentIcon({ color = '#A78BFA', size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
    </svg>
  );
}
function SkillIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#00E5A0" strokeWidth="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function InstructionIcon({ color = '#FBB040' }: { color?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}
