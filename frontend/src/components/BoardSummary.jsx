import React, { useRef, useEffect } from 'react';
import { Crown, Loader2, CheckCircle2 } from 'lucide-react';

export default function BoardSummary({ summaryState }) {
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current && summaryState.status === 'thinking') {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [summaryState.content, summaryState.status]);

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#C9A84C] whitespace-nowrap">
          Board Summary
        </h2>
        <div className="flex-1 h-px bg-[#C9A84C]/20" />
        {summaryState.status === 'thinking' && (
          <div className="flex items-center gap-1.5 text-[#C9A84C]">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[10px] animate-pulse">Director compiling…</span>
          </div>
        )}
        {summaryState.status === 'done' && (
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span className="text-[10px]">Session complete</span>
          </div>
        )}
      </div>

      {/* Card */}
      <div className="bg-[#111111] rounded-xl border border-[#C9A84C]/25 overflow-hidden shadow-[0_0_50px_rgba(201,168,76,0.07)]">
        {/* Card header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#C9A84C]/8 to-transparent border-b border-[#C9A84C]/15">
          <div className="w-9 h-9 rounded-lg bg-[#C9A84C]/15 flex items-center justify-center flex-shrink-0">
            <Crown className="w-4.5 h-4.5 text-[#C9A84C]" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <h3 className="text-[#C9A84C] font-semibold text-sm leading-none mb-0.5">
              Director — Executive Verdict
            </h3>
            <p className="text-[#C9A84C]/50 text-[10px]">
              Final synthesis, decisions & next steps
            </p>
          </div>

          {summaryState.status === 'thinking' && (
            <div className="ml-auto dot-pulse flex items-center">
              <span style={{ background: '#C9A84C' }} />
              <span style={{ background: '#C9A84C' }} />
              <span style={{ background: '#C9A84C' }} />
            </div>
          )}
        </div>

        {/* Card body */}
        <div ref={bodyRef} className="px-6 py-6 overflow-y-auto max-h-[520px]">
          {summaryState.status === 'thinking' && !summaryState.content && (
            <div className="flex items-center gap-2.5 text-[#C9A84C]">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <span className="text-sm">Director is compiling the executive verdict…</span>
            </div>
          )}

          {summaryState.content && (
            <p
              className={`text-stream text-gray-200 text-sm leading-relaxed ${
                summaryState.status === 'thinking' ? 'cursor-blink' : ''
              }`}
            >
              {summaryState.content}
            </p>
          )}

          {summaryState.status === 'error' && (
            <div className="flex items-start gap-2 text-red-400">
              <span className="text-sm font-semibold">Error:</span>
              <p className="text-sm">{summaryState.content}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {summaryState.status === 'done' && summaryState.content && (
          <div className="px-6 py-3 border-t border-[#C9A84C]/10 bg-[#C9A84C]/3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-[10px] text-gray-600">
              Board session finalized · {summaryState.content.length} chars
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
