import React, { useRef, useEffect, useState } from 'react';
import { X, Copy, RefreshCw, Check, Loader2, Clock, Hash } from 'lucide-react';
import { AGENT_META } from './BoardroomTable.jsx';

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function AgentPanel({
  agentKey,
  agentState,
  agentConfigs,
  request,
  allOutputs,
  onClose,
  onRerun,
  isRerunning,
}) {
  const meta        = AGENT_META.find((m) => m.key === agentKey);
  const displayName = agentConfigs?.[agentKey]?.name || meta?.name || agentKey;
  const displayRole = agentConfigs?.[agentKey]?.role || meta?.role || '';
  const Icon        = meta?.icon;
  const color       = meta?.color ?? '#C9A84C';

  const [copied, setCopied] = useState(false);
  const bodyRef = useRef(null);

  // Scroll to bottom when content grows
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [agentState?.content]);

  const handleCopy = async () => {
    const text = agentState?.content ?? '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const status  = agentState?.status  ?? 'idle';
  const content = agentState?.content ?? '';
  const tokens  = agentState?.tokens;

  const statusColors = {
    idle:     '#527052',
    thinking: '#C9A84C',
    done:     '#4ade80',
    error:    '#f87171',
  };

  return (
    <div
      className="fixed right-0 top-0 h-full z-50 flex flex-col panel-enter"
      style={{
        width: '420px',
        background: '#060e06',
        borderLeft: '1px solid #1a3020',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.7)',
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid #152015',
          background: `${color}08`,
          padding: '16px 20px',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}
            >
              {Icon && <Icon className="w-4.5 h-4.5" style={{ color, width: 18, height: 18 }} />}
            </div>
            <div>
              <h3 className="text-sm font-bold leading-none" style={{ color: '#d8e8d8' }}>
                {displayName}
              </h3>
              <p className="text-[10px] mt-0.5 font-mono" style={{ color: '#527052' }}>
                {displayRole}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status badge */}
            <span
              className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border tracking-widest uppercase"
              style={{
                color:            statusColors[status],
                borderColor:      `${statusColors[status]}40`,
                backgroundColor:  `${statusColors[status]}12`,
              }}
            >
              {status}
            </span>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: '#527052' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4" style={{ color: '#2a4a2a' }}>
          <div className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            <span className="text-[10px] font-mono uppercase">Agent Report</span>
          </div>
          {tokens && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono" style={{ color: '#3a5a3a' }}>
                ↑{tokens.input_tokens} ↓{tokens.output_tokens} tok
              </span>
            </div>
          )}
          {agentState?.timestamp && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className="text-[10px] font-mono">{fmtTime(agentState.timestamp)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto p-5">
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            {Icon && <Icon className="w-8 h-8 mb-3 opacity-15" style={{ color }} />}
            <p className="text-xs font-mono" style={{ color: '#2a4a2a' }}>
              Agent has not run yet
            </p>
          </div>
        )}

        {status === 'thinking' && !content && (
          <div className="flex items-center gap-2 mt-2" style={{ color: '#C9A84C' }}>
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            <span className="text-xs font-mono">Processing request…</span>
          </div>
        )}

        {content && (
          <pre className="response-text">{content}</pre>
        )}
      </div>

      {/* Footer toolbar */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderTop: '1px solid #152015', background: '#050c05' }}
      >
        <button
          onClick={handleCopy}
          disabled={!content}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all"
          style={{
            color:           content ? (copied ? '#4ade80' : '#C9A84C') : '#2a4a2a',
            background:      content ? 'rgba(201,168,76,0.08)' : 'transparent',
            border:          `1px solid ${content ? 'rgba(201,168,76,0.2)' : '#152015'}`,
            cursor:          content ? 'pointer' : 'not-allowed',
          }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>

        <button
          onClick={() => onRerun(agentKey)}
          disabled={isRerunning || !request}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all"
          style={{
            color:           !isRerunning && request ? '#C9A84C' : '#2a4a2a',
            background:      !isRerunning && request ? 'rgba(201,168,76,0.08)' : 'transparent',
            border:          `1px solid ${!isRerunning && request ? 'rgba(201,168,76,0.25)' : '#152015'}`,
            cursor:          isRerunning || !request ? 'not-allowed' : 'pointer',
          }}
        >
          {isRerunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {isRerunning ? 'Running…' : 'Re-run Agent'}
        </button>
      </div>
    </div>
  );
}
