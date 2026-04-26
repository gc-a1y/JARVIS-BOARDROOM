import React, { useRef, useEffect, useState } from 'react';
import { Crown, Loader2, CheckCircle2, Copy, Check, Download } from 'lucide-react';

export default function BoardSummary({ summaryState, session }) {
  const bodyRef       = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (bodyRef.current && summaryState.status === 'thinking') {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [summaryState.content, summaryState.status]);

  const handleCopy = async () => {
    const text = summaryState?.content ?? '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!session) return;

    const lines = [
      '═══════════════════════════════════════════════════════════════',
      '  JARVIS BOARD — CLASSIFIED OPERATIONS',
      '  FULL SESSION TRANSCRIPT',
      '═══════════════════════════════════════════════════════════════',
      '',
      `MISSION ID  : ${session.missionId ?? 'UNKNOWN'}`,
      `TIMESTAMP   : ${new Date(session.timestamp).toISOString()}`,
      `REQUEST     : ${session.request}`,
      '',
      '───────────────────────────────────────────────────────────────',
      '',
    ];

    const agents = ['director', 'architect', 'spark', 'stack', 'memo', 'sharp'];
    const labels = {
      director:  'DIRECTOR  — Manager',
      architect: 'ARCHITECT — Prompt Engineer',
      spark:     'SPARK     — Brainstormer',
      stack:     'STACK     — Developer',
      memo:      'MEMO      — Scribe',
      sharp:     'SHARP     — Editor',
    };

    for (const key of agents) {
      const content = session.agentOutputs?.[key];
      if (!content) continue;
      lines.push(`[ ${labels[key]} ]`);
      lines.push('');
      lines.push(content);
      lines.push('');
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('');
    }

    lines.push('[ DIRECTOR — Executive Verdict ]');
    lines.push('');
    lines.push(session.summary ?? summaryState.content ?? '');
    lines.push('');

    if (session.totalTokens) {
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push(`TOKENS     : ${session.totalTokens.input} in / ${session.totalTokens.output} out`);
      const total = session.totalTokens.input + session.totalTokens.output;
      lines.push(`TOTAL      : ${total.toLocaleString()} tokens`);
    }

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('  END OF SESSION TRANSCRIPT — HANDLE WITH CARE');
    lines.push('═══════════════════════════════════════════════════════════════');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${session.missionId ?? 'JARVIS-BOARD'}-session.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className="text-[10px] font-mono font-semibold uppercase tracking-widest whitespace-nowrap"
          style={{ color: '#C9A84C' }}
        >
          Board Summary
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />

        {summaryState.status === 'thinking' && (
          <div className="flex items-center gap-1.5" style={{ color: '#C9A84C' }}>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[10px] font-mono animate-pulse">Director compiling…</span>
          </div>
        )}
        {summaryState.status === 'done' && (
          <div className="flex items-center gap-1.5" style={{ color: '#4ade80' }}>
            <CheckCircle2 className="w-3 h-3" />
            <span className="text-[10px] font-mono">Session complete</span>
          </div>
        )}
      </div>

      {/* Card */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background:  '#070e07',
          border:      '1px solid rgba(201,168,76,0.2)',
          boxShadow:   '0 0 60px rgba(201,168,76,0.05)',
        }}
      >
        {/* Card header */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{
            background:   'linear-gradient(90deg, rgba(201,168,76,0.07) 0%, transparent 100%)',
            borderBottom: '1px solid rgba(201,168,76,0.12)',
          }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}
          >
            <Crown style={{ color: '#C9A84C', width: 18, height: 18 }} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-mono font-bold leading-none" style={{ color: '#C9A84C' }}>
              Director — Executive Verdict
            </h3>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(201,168,76,0.4)' }}>
              Final synthesis · decisions · next steps
            </p>
          </div>

          {/* Toolbar */}
          {summaryState.status === 'done' && summaryState.content && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-mono transition-all"
                style={{
                  color:      copied ? '#4ade80' : '#C9A84C',
                  background: 'rgba(201,168,76,0.08)',
                  border:     '1px solid rgba(201,168,76,0.2)',
                }}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>

              {session && (
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-mono transition-all"
                  style={{
                    color:      '#527052',
                    background: 'rgba(82,112,82,0.08)',
                    border:     '1px solid rgba(82,112,82,0.2)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#b8d8b8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#527052'; }}
                >
                  <Download className="w-3 h-3" />
                  Export .txt
                </button>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div ref={bodyRef} className="px-6 py-6 overflow-y-auto" style={{ maxHeight: '500px' }}>
          {summaryState.status === 'thinking' && !summaryState.content && (
            <div className="flex items-center gap-2.5" style={{ color: '#C9A84C' }}>
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <span className="text-sm font-mono">Director is compiling the executive verdict…</span>
            </div>
          )}

          {summaryState.content && (
            <pre
              className={`response-text ${summaryState.status === 'thinking' ? 'cursor-blink' : ''}`}
              style={{ color: '#c8e0c8' }}
            >
              {summaryState.content}
            </pre>
          )}

          {summaryState.status === 'error' && (
            <p className="text-sm font-mono" style={{ color: '#f87171' }}>
              Error: {summaryState.content}
            </p>
          )}
        </div>

        {/* Footer with token count */}
        {summaryState.status === 'done' && session?.totalTokens && (
          <div
            className="px-6 py-3 flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(201,168,76,0.08)', background: 'rgba(201,168,76,0.03)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ade80' }} />
              <span className="text-[10px] font-mono" style={{ color: '#3a5a3a' }}>
                Session finalized
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: '#3a5a3a' }}>
              <span>↑{session.totalTokens.input.toLocaleString()} in</span>
              <span>↓{session.totalTokens.output.toLocaleString()} out</span>
              <span>
                Total: {(session.totalTokens.input + session.totalTokens.output).toLocaleString()} tokens
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
