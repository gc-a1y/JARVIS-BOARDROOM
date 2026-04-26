import React, { useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const STATUS_META = {
  idle: {
    label: 'IDLE',
    labelClass: 'text-gray-600 bg-[#161616] border-gray-800',
    borderClass: 'border-[#1c1c1c]',
    cardClass: '',
  },
  thinking: {
    label: 'THINKING',
    labelClass: 'text-[#C9A84C] bg-[#C9A84C]/10 border-[#C9A84C]/30',
    borderClass: 'border-[#C9A84C]/60',
    cardClass: 'card-thinking',
  },
  done: {
    label: 'DONE',
    labelClass: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    borderClass: 'border-[#1c1c1c]',
    cardClass: '',
  },
  error: {
    label: 'ERROR',
    labelClass: 'text-red-400 bg-red-400/10 border-red-400/30',
    borderClass: 'border-red-400/40',
    cardClass: '',
  },
};

export default function AgentCard({ name, role, icon: Icon, color, status, content }) {
  const bodyRef = useRef(null);
  const meta = STATUS_META[status] ?? STATUS_META.idle;

  // Scroll to bottom while streaming
  useEffect(() => {
    if (bodyRef.current && status === 'thinking') {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [content, status]);

  return (
    <div
      className={`
        flex flex-col bg-[#111111] rounded-xl border transition-all duration-300
        ${meta.borderClass} ${meta.cardClass}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#181818]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}18` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-none truncate">{name}</p>
            <p className="text-gray-600 text-[10px] mt-0.5 truncate">{role}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {status === 'thinking' && (
            <div className="dot-pulse flex items-center">
              <span />
              <span />
              <span />
            </div>
          )}
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded border tracking-widest whitespace-nowrap ${meta.labelClass}`}
          >
            {meta.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div
        ref={bodyRef}
        className="flex-1 overflow-y-auto px-4 py-4 min-h-[160px] max-h-[260px]"
      >
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <Icon className="w-7 h-7 mb-2 opacity-15" style={{ color }} />
            <p className="text-[11px] text-gray-700">Awaiting deployment</p>
          </div>
        )}

        {status === 'thinking' && !content && (
          <div className="flex items-center gap-2 text-[#C9A84C] mt-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
            <span className="text-xs">Analyzing request…</span>
          </div>
        )}

        {content && (
          <p className={`text-stream text-gray-300 text-xs ${status === 'thinking' ? 'cursor-blink' : ''}`}>
            {content}
          </p>
        )}
      </div>

      {/* Footer strip when done */}
      {status === 'done' && (
        <div className="px-4 py-2 border-t border-[#181818] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
          <span className="text-[10px] text-gray-700">Complete · {content.length} chars</span>
        </div>
      )}
    </div>
  );
}
