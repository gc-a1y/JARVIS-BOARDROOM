import React from 'react';
import { Crown, PenTool, Zap, Code2, FileText, Scissors } from 'lucide-react';
import AgentCard from './AgentCard';

export const AGENTS = [
  { key: 'director',  name: 'Director',  role: 'Manager',          icon: Crown,    color: '#C9A84C' },
  { key: 'architect', name: 'Architect', role: 'Prompt Engineer',   icon: PenTool,  color: '#60a5fa' },
  { key: 'spark',     name: 'Spark',     role: 'Brainstormer',      icon: Zap,      color: '#fbbf24' },
  { key: 'stack',     name: 'Stack',     role: 'Developer',         icon: Code2,    color: '#34d399' },
  { key: 'memo',      name: 'Memo',      role: 'Scribe',            icon: FileText, color: '#a78bfa' },
  { key: 'sharp',     name: 'Sharp',     role: 'Editor',            icon: Scissors, color: '#f87171' },
];

export default function AgentGrid({ agentStates }) {
  const doneCount = Object.values(agentStates).filter((a) => a.status === 'done').length;
  const totalRunning = Object.values(agentStates).some((a) => a.status === 'thinking');

  return (
    <section className="mb-8">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 whitespace-nowrap">
          Agent Boardroom
        </h2>
        <div className="flex-1 h-px bg-[#1c1c1c]" />
        {totalRunning && (
          <span className="text-[10px] text-[#C9A84C] animate-pulse whitespace-nowrap">
            ● Live session
          </span>
        )}
        <span className="text-[10px] text-gray-700 whitespace-nowrap">
          {doneCount}/6 complete
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENTS.map((agent) => (
          <AgentCard
            key={agent.key}
            name={agent.name}
            role={agent.role}
            icon={agent.icon}
            color={agent.color}
            status={agentStates[agent.key]?.status ?? 'idle'}
            content={agentStates[agent.key]?.content ?? ''}
          />
        ))}
      </div>
    </section>
  );
}
