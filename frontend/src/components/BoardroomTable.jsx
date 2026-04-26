import React from 'react';
import { Crown, PenTool, Zap, Code2, FileText, Scissors, Check, Loader2 } from 'lucide-react';

export const AGENT_META = [
  { key: 'director',  name: 'Director',  role: 'Manager',        icon: Crown,    color: '#C9A84C' },
  { key: 'architect', name: 'Architect', role: 'Prompt Engineer', icon: PenTool,  color: '#60a5fa' },
  { key: 'spark',     name: 'Spark',     role: 'Brainstormer',    icon: Zap,      color: '#fbbf24' },
  { key: 'stack',     name: 'Stack',     role: 'Developer',       icon: Code2,    color: '#34d399' },
  { key: 'memo',      name: 'Memo',      role: 'Scribe',          icon: FileText, color: '#a78bfa' },
  { key: 'sharp',     name: 'Sharp',     role: 'Editor',          icon: Scissors, color: '#f87171' },
];

// Seat positions around the oval table.
// Container is 100% wide × 460px tall. Table uses inset 10%/13%.
const SEAT_STYLES = {
  director:  { position: 'absolute', left: '1%',  top: '50%', transform: 'translateY(-50%)' },
  architect: { position: 'absolute', left: '27%', top:  '2%' },
  spark:     { position: 'absolute', right:'27%', top:  '2%' },
  stack:     { position: 'absolute', right: '1%', top: '50%', transform: 'translateY(-50%)' },
  memo:      { position: 'absolute', right:'27%', bottom:'2%' },
  sharp:     { position: 'absolute', left: '27%', bottom:'2%' },
};

function AgentSeat({ meta, status, isSelected, onClick }) {
  const { key, name, role, icon: Icon, color } = meta;
  const isThinking = status === 'thinking';
  const isDone     = status === 'done';

  return (
    <div
      style={SEAT_STYLES[key]}
      className="flex flex-col items-center cursor-pointer group z-10"
      onClick={() => onClick(key)}
      title={`${name} — ${role}`}
    >
      {/* Status ring + icon circle */}
      <div className="relative">
        {/* Outer pulse ring when thinking */}
        {isThinking && (
          <div
            className="absolute inset-[-5px] rounded-full opacity-60"
            style={{
              border: `2px solid ${color}`,
              animation: 'seatGlow 1.5s ease-in-out infinite',
            }}
          />
        )}

        {/* Main seat circle */}
        <div
          className={`
            w-[60px] h-[60px] rounded-full flex items-center justify-center border-2
            transition-all duration-300 relative
            ${isSelected ? 'scale-110 shadow-[0_0_24px_rgba(201,168,76,0.5)]' : 'group-hover:scale-105'}
          `}
          style={{
            background:   `${color}14`,
            borderColor:  isThinking ? color : isDone ? '#4ade80' : '#1a3020',
            boxShadow:    isThinking ? `0 0 18px ${color}55` : isDone ? '0 0 10px rgba(74,222,128,0.3)' : 'none',
          }}
        >
          {isThinking ? (
            <Loader2 className="w-5 h-5 animate-spin" style={{ color }} />
          ) : (
            <Icon className="w-5 h-5 transition-transform duration-200" style={{ color }} />
          )}
        </div>

        {/* Done checkmark badge */}
        {isDone && (
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center border border-[#040c04]">
            <Check className="w-2.5 h-2.5 text-black" />
          </div>
        )}

        {/* Selected indicator dot */}
        {isSelected && (
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
        )}
      </div>

      {/* Name + role label */}
      <div className="mt-2 text-center select-none">
        <p
          className="text-[11px] font-bold leading-none transition-colors duration-200"
          style={{ color: isSelected ? '#C9A84C' : isThinking ? color : '#8aaa8a' }}
        >
          {name}
        </p>
        <p className="text-[9px] text-gov-muted mt-0.5 leading-none" style={{ color: '#3a5a3a' }}>
          {role}
        </p>
      </div>
    </div>
  );
}

export default function BoardroomTable({ agentStates, selectedAgent, onAgentClick, agentConfigs }) {
  const doneCount   = Object.values(agentStates).filter((a) => a.status === 'done').length;
  const activeAgent = Object.entries(agentStates).find(([, v]) => v.status === 'thinking')?.[0];

  // Merge custom names/roles from settings into meta
  const resolvedMeta = AGENT_META.map((m) => ({
    ...m,
    name: agentConfigs?.[m.key]?.name || m.name,
    role: agentConfigs?.[m.key]?.role || m.role,
  }));

  return (
    <section className="mb-6">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-gov-muted" style={{ color: '#527052' }}>
          Boardroom — Click a seat to view report
        </span>
        <div className="flex-1 h-px" style={{ background: '#1a3020' }} />
        {activeAgent && (
          <div className="flex items-center gap-1.5">
            <div className="dot-pulse flex items-center">
              <span /><span /><span />
            </div>
            <span className="text-[10px] font-mono text-[#C9A84C] animate-pulse">
              {resolvedMeta.find(m => m.key === activeAgent)?.name} thinking…
            </span>
          </div>
        )}
        <span className="text-[10px] font-mono whitespace-nowrap" style={{ color: '#2a4a2a' }}>
          {doneCount}/6
        </span>
      </div>

      {/* Table container */}
      <div className="relative w-full" style={{ height: '460px' }}>

        {/* ── Mahogany oval table ─────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            left: '13%', right: '13%',
            top:  '10%', bottom: '10%',
            borderRadius: '50%',
            background: `
              radial-gradient(ellipse at 42% 32%, #3a1c08 0%, #1e0e04 45%, #160a03 75%, #0e0601 100%)
            `,
            border: '1px solid rgba(70,35,8,0.7)',
            boxShadow: `
              0 30px 100px rgba(0,0,0,0.95),
              0 8px 30px rgba(0,0,0,0.8),
              inset 0 2px 4px rgba(255,255,255,0.04),
              inset 0 -4px 12px rgba(0,0,0,0.6)
            `,
          }}
        >
          {/* Inner decorative ring */}
          <div
            style={{
              position: 'absolute',
              inset: '8%',
              borderRadius: '50%',
              border: '1px solid rgba(201,168,76,0.06)',
              pointerEvents: 'none',
            }}
          />

          {/* Second inner ring */}
          <div
            style={{
              position: 'absolute',
              inset: '18%',
              borderRadius: '50%',
              border: '1px solid rgba(201,168,76,0.04)',
              pointerEvents: 'none',
            }}
          />

          {/* Center nameplate */}
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '5px', pointerEvents: 'none',
            }}
          >
            <span style={{
              color: 'rgba(201,168,76,0.35)',
              fontSize: '13px', fontWeight: 800,
              letterSpacing: '0.45em', fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase',
            }}>
              JARVIS
            </span>
            <div style={{ width: '40px', height: '1px', background: 'rgba(201,168,76,0.15)' }} />
            <span style={{
              color: 'rgba(201,168,76,0.2)',
              fontSize: '9px',
              letterSpacing: '0.5em', fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase',
            }}>
              BOARD
            </span>

            {/* Active agent indicator on table */}
            {activeAgent && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: '#C9A84C',
                  animation: 'dotPulse 1.4s ease-in-out infinite',
                }} />
                <span style={{
                  color: 'rgba(201,168,76,0.5)',
                  fontSize: '8px',
                  letterSpacing: '0.3em',
                  fontFamily: 'monospace',
                }}>
                  LIVE
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Agent seats ─────────────────────────────────────── */}
        {resolvedMeta.map((meta) => (
          <AgentSeat
            key={meta.key}
            meta={meta}
            status={agentStates[meta.key]?.status ?? 'idle'}
            isSelected={selectedAgent === meta.key}
            onClick={onAgentClick}
          />
        ))}
      </div>
    </section>
  );
}
