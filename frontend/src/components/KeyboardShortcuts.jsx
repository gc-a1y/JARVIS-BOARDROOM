import React from 'react';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['⌘', 'Enter'], desc: 'Deploy all agents' },
  { keys: ['⌘', 'F'],     desc: 'Toggle Focus Mode (selected agent)' },
  { keys: ['⌘', 'E'],     desc: 'Export session as .txt' },
  { keys: ['⌘', 'K'],     desc: 'New Mission (clear board)' },
  { keys: ['⌘', '/'],     desc: 'Show keyboard shortcuts' },
  { keys: ['Esc'],         desc: 'Close panel / focus mode' },
];

export default function KeyboardShortcuts({ isLight, onClose }) {
  const bg     = isLight ? '#faf8f2' : '#060e06';
  const border = isLight ? '#d4c8a0' : '#1a3020';
  const text   = isLight ? '#2a2518' : '#b8d8b8';
  const dim    = isLight ? '#9a9070' : '#3a5a3a';
  const kbg    = isLight ? '#f0ede4' : '#0b1a0b';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-xl overflow-hidden"
        style={{
          width: '400px',
          background: bg,
          border: `1px solid ${border}`,
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${border}` }}
        >
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4" style={{ color: '#C9A84C' }} />
            <span className="text-sm font-mono font-bold" style={{ color: '#C9A84C' }}>
              Keyboard Shortcuts
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10"
            style={{ color: dim }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-5 space-y-2">
          {SHORTCUTS.map(({ keys, desc }) => (
            <div key={desc} className="flex items-center justify-between gap-4">
              <span className="text-xs font-mono" style={{ color: text }}>{desc}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                {keys.map((k, i) => (
                  <React.Fragment key={i}>
                    <kbd
                      className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold"
                      style={{
                        background: kbg,
                        border: `1px solid ${border}`,
                        color: '#C9A84C',
                        boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      {k}
                    </kbd>
                    {i < keys.length - 1 && (
                      <span className="text-[10px]" style={{ color: dim }}>+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          className="px-5 py-3"
          style={{ borderTop: `1px solid ${border}` }}
        >
          <p className="text-[10px] font-mono text-center" style={{ color: dim }}>
            Press any key to dismiss
          </p>
        </div>
      </div>
    </div>
  );
}
