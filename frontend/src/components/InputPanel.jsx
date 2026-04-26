import React, { useRef, useEffect } from 'react';
import { Cpu, Send, Zap } from 'lucide-react';

export default function InputPanel({ value, onChange, onDeploy, isRunning }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 220) + 'px';
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isRunning && value.trim()) {
      onDeploy();
    }
  };

  const canDeploy = value.trim() && !isRunning;

  return (
    <div className="mb-7">
      {/* Mission label */}
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-3.5 h-3.5 text-[#C9A84C]" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C9A84C]">
          New Mission
        </span>
      </div>

      <div
        className={`
          bg-[#111111] rounded-xl border transition-all duration-200
          ${isRunning
            ? 'border-[#C9A84C]/40 shadow-[0_0_24px_rgba(201,168,76,0.08)]'
            : 'border-[#1c1c1c] focus-within:border-[#C9A84C]/50 focus-within:shadow-[0_0_20px_rgba(201,168,76,0.06)]'}
        `}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your mission… What should the board tackle? Be specific."
          disabled={isRunning}
          rows={2}
          className="w-full bg-transparent text-gray-200 placeholder-gray-700 resize-none outline-none text-sm leading-relaxed px-5 pt-5 pb-3 disabled:opacity-50 min-h-[72px]"
        />

        <div className="flex items-center justify-between px-5 pb-4 pt-1">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-gray-700">{value.length} chars</span>
            {!isRunning && (
              <span className="text-[10px] text-gray-700 hidden sm:block">
                ⌘↵ to deploy
              </span>
            )}
          </div>

          <button
            onClick={onDeploy}
            disabled={!canDeploy}
            className={`
              flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150
              ${canDeploy
                ? 'bg-[#C9A84C] text-black hover:bg-[#E8C86A] active:scale-95 cursor-pointer shadow-[0_0_16px_rgba(201,168,76,0.25)]'
                : 'bg-[#1a1a1a] text-gray-600 cursor-not-allowed'}
            `}
          >
            {isRunning ? (
              <>
                <Cpu className="w-4 h-4 animate-spin" />
                <span>Deploying…</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Deploy Agents</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress bar when running */}
      {isRunning && (
        <div className="mt-2 h-0.5 bg-[#1c1c1c] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#C9A84C] to-[#E8C86A] rounded-full animate-pulse"
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  );
}
