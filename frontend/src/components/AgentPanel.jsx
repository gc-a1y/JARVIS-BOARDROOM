import React, { useRef, useEffect, useState } from 'react';
import {
  X, Copy, RefreshCw, Check, Loader2, Clock, Hash,
  ThumbsUp, ThumbsDown, Maximize2, ChevronDown, ChevronUp, Terminal,
} from 'lucide-react';
import { AGENT_META } from './BoardroomTable.jsx';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import { extractClaudeCodePrompt } from './ClaudeCodeModal.jsx';

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function AgentPanel({
  agentKey,
  agentState,
  agentConfigs,
  request,
  onClose,
  onRerun,
  isRerunning,
  isLight,
  fontSize,
  onFocusMode,
  onShowClaudeCode,
}) {
  const meta        = AGENT_META.find((m) => m.key === agentKey);
  const displayName = agentConfigs?.[agentKey]?.name || meta?.name || agentKey;
  const displayRole = agentConfigs?.[agentKey]?.role || meta?.role || '';
  const Icon        = meta?.icon;
  const color       = meta?.color ?? '#C9A84C';

  const [copied,      setCopied]      = useState(false);
  const [rating,      setRating]      = useState(null); // null | 'up' | 'down'
  const [isCollapsed, setIsCollapsed] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current && !isCollapsed) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [agentState?.content, isCollapsed]);

  const handleCopy = async () => {
    const text = agentState?.content ?? '';
    if (!text) return;
    try { await navigator.clipboard.writeText(text); }
    catch {
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

  const status  = agentState?.status  ?? 'idle';
  const content = agentState?.content ?? '';
  const tokens  = agentState?.tokens;
  const hasClaudeCode = agentKey === 'director' && !!extractClaudeCodePrompt(content);

  // Theme colours
  const bg      = isLight ? '#faf8f2' : '#060e06';
  const bdr     = isLight ? '#d4c8a0' : '#1a3020';
  const bdrHead = isLight ? '#e0d8c0' : '#152015';
  const headBg  = isLight ? `${color}0a` : `${color}08`;
  const textMain = isLight ? '#2a2518' : '#d8e8d8';
  const textDim  = isLight ? '#9a9070' : '#527052';
  const textMeta = isLight ? '#7a7060' : '#2a4a2a';
  const footBg   = isLight ? '#f5f0e8' : '#050c05';

  const statusColors = {
    idle:     textDim,
    thinking: '#C9A84C',
    done:     '#4ade80',
    error:    '#f87171',
  };

  const pill = (active, activeColor) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 26, height: 26, borderRadius: 6, cursor: 'pointer',
    border: `1px solid ${active ? `${activeColor}50` : bdrHead}`,
    background: active ? `${activeColor}12` : 'transparent',
    color: active ? activeColor : textDim,
    transition: 'all 0.15s',
  });

  const actionBtn = (enabled) => ({
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 10px', borderRadius: 5, cursor: enabled ? 'pointer' : 'not-allowed',
    fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
    border: `1px solid ${enabled ? 'rgba(201,168,76,0.25)' : bdrHead}`,
    background: enabled ? 'rgba(201,168,76,0.08)' : 'transparent',
    color: enabled ? '#C9A84C' : textMeta,
    transition: 'all 0.15s',
  });

  return (
    <div
      className="fixed right-0 top-0 h-full z-50 flex flex-col panel-enter"
      style={{ width: 420, background: bg, borderLeft: `1px solid ${bdr}`, boxShadow: '-20px 0 60px rgba(0,0,0,0.6)' }}
    >
      {/* ── Header ── */}
      <div style={{ borderBottom: `1px solid ${bdrHead}`, background: headBg, padding: '14px 18px' }}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}
            >
              {Icon && <Icon style={{ color, width: 18, height: 18 }} />}
            </div>
            <div>
              <h3 className="text-sm font-bold leading-none" style={{ color: textMain }}>{displayName}</h3>
              <p className="text-[10px] mt-0.5 font-mono" style={{ color: textDim }}>{displayRole}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsCollapsed((v) => !v)}
              style={pill(false, '#C9A84C')}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed
                ? <ChevronDown style={{ width: 13, height: 13 }} />
                : <ChevronUp   style={{ width: 13, height: 13 }} />}
            </button>

            <span
              className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border tracking-widest uppercase"
              style={{
                color:           statusColors[status],
                borderColor:     `${statusColors[status]}40`,
                backgroundColor: `${statusColors[status]}12`,
              }}
            >
              {status}
            </span>

            <button
              onClick={onClose}
              style={pill(false, '#f87171')}
              title="Close"
            >
              <X style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4" style={{ color: textMeta }}>
          <div className="flex items-center gap-1">
            <Hash style={{ width: 11, height: 11 }} />
            <span className="text-[10px] font-mono uppercase">Agent Report</span>
          </div>
          {tokens && (
            <span className="text-[10px] font-mono" style={{ color: textDim }}>
              ↑{tokens.input_tokens} ↓{tokens.output_tokens} tok
            </span>
          )}
          {agentState?.timestamp && (
            <div className="flex items-center gap-1">
              <Clock style={{ width: 11, height: 11 }} />
              <span className="text-[10px] font-mono">{fmtTime(agentState.timestamp)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      {!isCollapsed ? (
        <div ref={bodyRef} className="flex-1 overflow-y-auto p-5">
          {status === 'idle' && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              {Icon && <Icon className="w-8 h-8 mb-3 opacity-15" style={{ color }} />}
              <p className="text-xs font-mono" style={{ color: textMeta }}>Agent has not run yet</p>
            </div>
          )}

          {status === 'thinking' && !content && (
            <div className="flex items-center gap-2 mt-2" style={{ color: '#C9A84C' }}>
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <span className="text-xs font-mono">Processing request…</span>
            </div>
          )}

          {content && (
            <MarkdownRenderer content={content} fontSize={fontSize} isLight={isLight} animate />
          )}
        </div>
      ) : (
        <button
          className="flex-1 flex items-center justify-center"
          onClick={() => setIsCollapsed(false)}
          style={{ color: textMeta, fontSize: 11, fontFamily: 'monospace' }}
        >
          Response hidden — click to expand
        </button>
      )}

      {/* ── Footer toolbar ── */}
      <div
        className="flex items-center justify-between px-4 py-2.5 gap-2"
        style={{ borderTop: `1px solid ${bdrHead}`, background: footBg, flexWrap: 'wrap' }}
      >
        {/* Left: copy + rating */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            disabled={!content}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 5,
              fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
              cursor: content ? 'pointer' : 'not-allowed',
              border: `1px solid ${content ? (copied ? 'rgba(74,222,128,0.3)' : 'rgba(201,168,76,0.25)') : bdrHead}`,
              background: content ? (copied ? 'rgba(74,222,128,0.1)' : 'rgba(201,168,76,0.08)') : 'transparent',
              color: content ? (copied ? '#4ade80' : '#C9A84C') : textMeta,
              transition: 'all 0.15s',
            }}
          >
            {copied ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>

          <button
            onClick={() => setRating((r) => r === 'up' ? null : 'up')}
            style={pill(rating === 'up', '#4ade80')}
            title="Good response"
          >
            <ThumbsUp style={{ width: 12, height: 12 }} />
          </button>
          <button
            onClick={() => setRating((r) => r === 'down' ? null : 'down')}
            style={pill(rating === 'down', '#f87171')}
            title="Poor response"
          >
            <ThumbsDown style={{ width: 12, height: 12 }} />
          </button>
        </div>

        {/* Right: focus + claude code + re-run */}
        <div className="flex items-center gap-1.5">
          {content && onFocusMode && (
            <button
              onClick={() => onFocusMode(agentKey)}
              style={pill(false, '#C9A84C')}
              title="Focus Mode (⌘F)"
            >
              <Maximize2 style={{ width: 12, height: 12 }} />
            </button>
          )}

          {hasClaudeCode && onShowClaudeCode && (
            <button
              onClick={onShowClaudeCode}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 5, cursor: 'pointer',
                fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
                border: '1px solid rgba(201,168,76,0.3)',
                background: 'rgba(201,168,76,0.1)',
                color: '#C9A84C',
                transition: 'all 0.15s',
              }}
              title="Claude Code Prompt"
            >
              <Terminal style={{ width: 12, height: 12 }} />
              Claude Code
            </button>
          )}

          <button
            onClick={() => onRerun(agentKey)}
            disabled={isRerunning || !request}
            style={actionBtn(!isRerunning && !!request)}
          >
            {isRerunning
              ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
              : <RefreshCw style={{ width: 12, height: 12 }} />}
            {isRerunning ? 'Running…' : 'Re-run'}
          </button>
        </div>
      </div>
    </div>
  );
}
