import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Loader2, ClipboardList } from 'lucide-react';

const PRIORITY = {
  high:   { text: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
  medium: { text: '#C9A84C', bg: 'rgba(201,168,76,0.1)',  border: 'rgba(201,168,76,0.3)'  },
  low:    { text: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)'  },
};

function lsKey(id) { return `jarvis-plan-checks-${id}`; }

export default function ProjectPlan({ plan, sessionId, isLight, isLoading }) {
  const [checked, setChecked] = useState(() => {
    if (!sessionId) return new Set();
    try { return new Set(JSON.parse(localStorage.getItem(lsKey(sessionId)) || '[]')); }
    catch { return new Set(); }
  });

  // Reset checked state when session changes
  useEffect(() => {
    if (!sessionId) return;
    try { setChecked(new Set(JSON.parse(localStorage.getItem(lsKey(sessionId)) || '[]'))); }
    catch { setChecked(new Set()); }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    localStorage.setItem(lsKey(sessionId), JSON.stringify([...checked]));
  }, [checked, sessionId]);

  const toggleTask = id => setChecked(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const bg      = isLight ? '#fffdf7' : '#070e07';
  const bdr     = isLight ? '#d4c8a0' : '#1a3020';
  const headBdr = isLight ? 'rgba(74,222,128,0.2)' : 'rgba(74,222,128,0.15)';
  const dim     = isLight ? '#9a9070' : '#3a5a3a';
  const text    = isLight ? '#2a2518' : '#b8d8b8';

  const completed = plan?.tasks?.filter(t => checked.has(t.id)).length ?? 0;
  const total     = plan?.tasks?.length ?? 0;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: '#4ade80' }}>
          Project Plan
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(74,222,128,0.15)' }} />
        {isLoading && (
          <div className="flex items-center gap-1.5" style={{ color: '#4ade80' }}>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[10px] font-mono animate-pulse">Generating plan…</span>
          </div>
        )}
        {plan && !isLoading && (
          <span className="text-[10px] font-mono" style={{ color: '#4ade80' }}>{completed}/{total} complete</span>
        )}
      </div>

      <div className="rounded-xl overflow-hidden"
        style={{ background: bg, border: `1px solid ${headBdr}`, boxShadow: '0 0 30px rgba(74,222,128,0.04)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4"
          style={{
            background: isLight
              ? 'linear-gradient(90deg, rgba(74,222,128,0.06) 0%, transparent 100%)'
              : 'linear-gradient(90deg, rgba(74,222,128,0.05) 0%, transparent 100%)',
            borderBottom: `1px solid ${headBdr}`,
          }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)' }}
          >
            <ClipboardList style={{ color: '#4ade80', width: 16, height: 16 }} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-mono font-bold leading-none" style={{ color: '#4ade80' }}>
              {plan?.title || 'Action Plan'}
            </h3>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(74,222,128,0.4)' }}>
              Auto-generated · check tasks as you complete them
            </p>
          </div>
          {plan && total > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{ background: isLight ? '#e8e0c8' : '#0f1a0f' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(completed / total) * 100}%`, background: '#4ade80' }}
                />
              </div>
              <span className="text-[10px] font-mono" style={{ color: 'rgba(74,222,128,0.6)' }}>
                {Math.round((completed / total) * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="px-5 py-4 space-y-2">
          {isLoading && !plan && (
            <div className="flex items-center justify-center gap-2 py-8" style={{ color: '#4ade80' }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-mono">Building your action plan…</span>
            </div>
          )}

          {plan?.tasks?.map(task => {
            const done = checked.has(task.id);
            const pc   = PRIORITY[task.priority] ?? PRIORITY.medium;
            return (
              <button key={task.id} onClick={() => toggleTask(task.id)}
                className="w-full text-left flex items-start gap-3 px-4 py-3 rounded-lg transition-all"
                style={{
                  background: done
                    ? (isLight ? 'rgba(74,222,128,0.04)' : 'rgba(74,222,128,0.03)')
                    : (isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)'),
                  border: `1px solid ${done ? 'rgba(74,222,128,0.2)' : bdr}`,
                  opacity: done ? 0.6 : 1,
                }}
              >
                {done
                  ? <CheckSquare style={{ color: '#4ade80', width: 15, height: 15, flexShrink: 0, marginTop: 2 }} />
                  : <Square      style={{ color: dim,       width: 15, height: 15, flexShrink: 0, marginTop: 2 }} />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold"
                      style={{ color: done ? dim : text, textDecoration: done ? 'line-through' : 'none' }}
                    >{task.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
                      style={{ color: pc.text, background: pc.bg, borderColor: pc.border }}
                    >{task.priority}</span>
                  </div>
                  <p className="text-[11px] font-mono mt-0.5 leading-snug" style={{ color: dim }}>{task.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] font-mono" style={{ color: dim }}>⏱ {task.estimatedTime}</span>
                    <span className="text-[9px] font-mono" style={{ color: dim }}>📅 {task.deadline}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
