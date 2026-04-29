import React, { useEffect } from 'react';
import { X, Sun, Loader2 } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer.jsx';

export default function MorningBriefing({ content, isLoading, fontSize, onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#040c04' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(201,168,76,0.15)', background: 'rgba(201,168,76,0.04)' }}
      >
        <div className="flex items-center gap-3">
          <Sun className="w-5 h-5" style={{ color: '#C9A84C' }} />
          <span className="text-sm font-mono font-bold tracking-widest uppercase" style={{ color: '#C9A84C' }}>
            Morning Briefing
          </span>
          <span className="text-[10px] font-mono" style={{ color: '#3a5a3a' }}>— Esc to close</span>
        </div>
        <button onClick={onClose}
          className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/10"
          style={{ color: '#527052' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-10 py-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Sun className="w-12 h-12" style={{ color: '#C9A84C', animation: 'seatGlow 2s ease-in-out infinite' }} />
              <p className="text-sm font-mono" style={{ color: '#527052' }}>Preparing your briefing…</p>
            </div>
          ) : content ? (
            <MarkdownRenderer content={content} fontSize={fontSize} isLight={false} animate />
          ) : null}
        </div>
      </div>
    </div>
  );
}
