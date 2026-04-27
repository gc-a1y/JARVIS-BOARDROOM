import React from 'react';
import { Activity, Clock, Cpu, DollarSign, CheckSquare } from 'lucide-react';

const INPUT_RATE  = 3  / 1_000_000;
const OUTPUT_RATE = 15 / 1_000_000;

function formatDuration(ms) {
  if (!ms || ms <= 0) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function SessionStats({ session, isLight }) {
  if (!session?.totalTokens) return null;

  const { input, output } = session.totalTokens;
  const total = input + output;
  const cost  = (input * INPUT_RATE + output * OUTPUT_RATE);
  const costStr = cost < 0.001 ? `<$0.001` : `$${cost.toFixed(4)}`;
  const duration = session.endTime && session.startTime
    ? session.endTime - session.startTime : null;
  const completed = Object.values(session.agentOutputs ?? {}).filter(Boolean).length;

  const bg     = isLight ? '#f5f0e8' : '#060e06';
  const border = isLight ? '#d4c8a0' : '#1a3020';
  const label  = isLight ? '#9a9070' : '#3a5a3a';
  const val    = isLight ? '#2a2518' : '#8aaa8a';

  const stats = [
    { icon: Cpu,        label: 'Total Tokens', value: total.toLocaleString() },
    { icon: DollarSign, label: 'Est. Cost',    value: costStr },
    { icon: Clock,      label: 'Time Taken',   value: formatDuration(duration) },
    { icon: CheckSquare,label: 'Agents Done',  value: `${completed}/6` },
  ];

  return (
    <div
      className="flex items-center gap-1 px-4 py-2.5 rounded-lg mb-4"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <Activity className="w-3 h-3 mr-2 flex-shrink-0" style={{ color: '#C9A84C' }} />
      <span className="text-[9px] font-mono uppercase tracking-widest mr-3" style={{ color: '#C9A84C' }}>
        Session Stats:
      </span>
      {stats.map(({ icon: Icon, label: l, value }) => (
        <div
          key={l}
          className="flex items-center gap-1.5 px-3 py-1 rounded"
          style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)', border: `1px solid ${border}` }}
        >
          <Icon className="w-3 h-3" style={{ color: '#C9A84C' }} />
          <span className="text-[9px] font-mono" style={{ color: label }}>{l}:</span>
          <span className="text-[10px] font-mono font-bold" style={{ color: val }}>{value}</span>
        </div>
      ))}
    </div>
  );
}
