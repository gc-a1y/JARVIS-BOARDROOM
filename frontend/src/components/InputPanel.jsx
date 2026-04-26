import React, { useRef, useEffect } from 'react';
import { Send, Loader2, Hash, Cpu } from 'lucide-react';

const INPUT_PER_TOK  = 3    / 1_000_000; // $3/MTok
const OUTPUT_PER_TOK = 15   / 1_000_000; // $15/MTok

function estimateCost(tok) {
  if (!tok) return null;
  const usd = tok.input * INPUT_PER_TOK + tok.output * OUTPUT_PER_TOK;
  return usd < 0.01
    ? `~$${(usd * 100).toFixed(3)}¢`
    : `~$${usd.toFixed(4)}`;
}

export default function InputPanel({
  value,
  onChange,
  onDeploy,
  isRunning,
  missionId,
  lastTokens,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isRunning && value.trim()) {
      onDeploy();
    }
  };

  const canDeploy = value.trim() && !isRunning;
  const cost      = estimateCost(lastTokens);

  return (
    <div className="mb-6">
      {/* Label row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-3 h-3" style={{ color: '#527052' }} />
          <span className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: '#527052' }}>
            Mission Brief
          </span>
        </div>

        {/* Last session token count */}
        {lastTokens && (
          <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: '#3a5a3a' }}>
            <span>↑{lastTokens.input.toLocaleString()} in</span>
            <span>↓{lastTokens.output.toLocaleString()} out</span>
            {cost && <span style={{ color: '#527052' }}>{cost}</span>}
          </div>
        )}
      </div>

      {/* Input container */}
      <div
        className="rounded-lg transition-all duration-200"
        style={{
          background:   '#080f08',
          border:       `1px solid ${isRunning ? 'rgba(201,168,76,0.4)' : '#1a3020'}`,
          boxShadow:    isRunning ? '0 0 20px rgba(201,168,76,0.06)' : 'none',
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRunning}
          rows={2}
          placeholder="Enter mission parameters… be specific and decisive."
          className="w-full bg-transparent outline-none resize-none px-4 pt-4 pb-3 font-mono text-sm disabled:opacity-50"
          style={{
            color:       '#9ab89a',
            lineHeight:  1.7,
            minHeight:   '72px',
          }}
        />

        <div
          className="flex items-center justify-between px-4 pb-3"
          style={{ borderTop: '1px solid #0f1a0f' }}
        >
          <div className="flex items-center gap-4 pt-2">
            <span className="text-[10px] font-mono" style={{ color: '#2a4a2a' }}>
              {value.length} chars
            </span>
            {missionId && (
              <div className="flex items-center gap-1">
                <Hash className="w-2.5 h-2.5" style={{ color: '#3a5a3a' }} />
                <span className="text-[10px] font-mono" style={{ color: '#3a5a3a' }}>
                  {missionId}
                </span>
              </div>
            )}
            {!isRunning && value.trim() && (
              <span className="text-[10px] font-mono" style={{ color: '#2a4a2a' }}>
                ⌘↵ deploy
              </span>
            )}
          </div>

          <button
            onClick={onDeploy}
            disabled={!canDeploy}
            className="flex items-center gap-2 px-5 py-2 rounded text-xs font-mono font-bold transition-all mt-2"
            style={{
              background:  canDeploy ? 'rgba(201,168,76,0.15)' : 'rgba(0,0,0,0.2)',
              border:      `1px solid ${canDeploy ? 'rgba(201,168,76,0.5)' : '#1a3020'}`,
              color:        canDeploy ? '#C9A84C' : '#2a4a2a',
              cursor:       canDeploy ? 'pointer' : 'not-allowed',
              boxShadow:    canDeploy ? '0 0 12px rgba(201,168,76,0.15)' : 'none',
              letterSpacing: '0.1em',
            }}
          >
            {isRunning ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…</>
            ) : (
              <><Send className="w-3.5 h-3.5" /> Deploy Agents</>
            )}
          </button>
        </div>
      </div>

      {/* Running progress bar */}
      {isRunning && (
        <div className="mt-1.5 h-0.5 rounded-full overflow-hidden" style={{ background: '#0f1a0f' }}>
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #C9A84C, #E8C86A, #C9A84C)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s linear infinite',
              width: '100%',
            }}
          />
        </div>
      )}
    </div>
  );
}
