import React, { useEffect } from 'react';
import { X, Maximize2 } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import { AGENT_META } from './BoardroomTable.jsx';

export default function FocusMode({ agentKey, content, fontSize, isLight, onClose }) {
  const meta  = AGENT_META.find((m) => m.key === agentKey) ?? AGENT_META[0];
  const Icon  = meta.icon;
  const color = meta.color;

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const bg     = isLight ? '#faf8f2' : '#040c04';
  const border = isLight ? '#d4c8a0' : '#1a3020';
  const dim    = isLight ? '#9a9070' : '#3a5a3a';
  const text   = isLight ? '#2a2518' : '#b8d8b8';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: bg }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-8 py-4 flex-shrink-0"
        style={{ borderBottom: `1px solid ${border}` }}
      >
        <div className="flex items-center gap-3">
          <Maximize2 className="w-4 h-4" style={{ color: '#C9A84C' }} />
          <span className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: '#C9A84C' }}>
            Focus Mode
          </span>
          <span className="text-[10px] font-mono" style={{ color: dim }}>— Esc to exit</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}
            >
              <Icon style={{ color, width: 14, height: 14 }} />
            </div>
            <span className="text-sm font-mono font-bold" style={{ color: text }}>{meta.name}</span>
            <span className="text-xs font-mono" style={{ color: dim }}>{meta.role}</span>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-black/10"
            style={{ color: dim }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-12 py-10">
          {content ? (
            <MarkdownRenderer
              content={content}
              fontSize={fontSize}
              isLight={isLight}
              animate
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Icon className="w-12 h-12 mb-4 opacity-15" style={{ color }} />
              <p className="font-mono text-sm" style={{ color: dim }}>No response available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
