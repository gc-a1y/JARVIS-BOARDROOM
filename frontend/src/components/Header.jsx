import React, { useState, useEffect } from 'react';
import { Shield, Radio, Sun, Moon, Type, Maximize2, Keyboard } from 'lucide-react';

function zeroPad(n) { return String(n).padStart(2, '0'); }
function militaryTime() {
  const d = new Date();
  return `${zeroPad(d.getUTCHours())}${zeroPad(d.getUTCMinutes())}${zeroPad(d.getUTCSeconds())}Z`;
}
function militaryDate() {
  const d = new Date();
  const mon = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${zeroPad(d.getUTCDate())}${mon[d.getUTCMonth()]}${d.getUTCFullYear()}`;
}

const FONT_LABELS = { sm: 'S', md: 'M', lg: 'L' };

export default function Header({
  missionId, isRunning, isLight, onToggleTheme,
  fontSize, onFontSize, onFocusMode, onKeyboardShortcuts,
  timerSeconds,
}) {
  const [time, setTime] = useState(militaryTime);
  useEffect(() => {
    const t = setInterval(() => setTime(militaryTime()), 1000);
    return () => clearInterval(t);
  }, []);

  const bg      = isLight ? '#faf8f2'  : '#050d05';
  const bdr     = isLight ? '#d4c8a0'  : '#1a3020';
  const textDim  = isLight ? '#9a9070' : '#3a6040';
  const textMain = isLight ? '#2a2518' : '#527052';

  const iconBtn = {
    width: 26, height: 26, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', border: `1px solid ${bdr}`,
    background: 'transparent', color: textMain, transition: 'all 0.15s',
  };

  return (
    <header
      className="flex items-center justify-between px-4 py-2 flex-shrink-0"
      style={{ background: bg, borderBottom: `1px solid ${bdr}`, minHeight: '42px' }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#cc2200' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#cc6600' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#1a8020' }} />
        </div>
        <Shield className="w-3 h-3 flex-shrink-0" style={{ color: '#C9A84C' }} />
        <span className="text-[11px] font-mono font-bold tracking-[0.3em] uppercase" style={{ color: '#C9A84C' }}>
          JARVIS BOARD
        </span>
        <span className="text-[11px] font-mono hidden sm:block" style={{ color: isLight ? '#d4c8a0' : '#1a4020' }}>—</span>
        <span className="text-[10px] font-mono tracking-widest uppercase hidden sm:block" style={{ color: isLight ? '#9a9070' : '#2a5030' }}>
          Classified Ops
        </span>
        <span className="badge-classified hidden md:block">CONFIDENTIAL</span>
      </div>

      {/* Center: mission ID */}
      <div className="flex items-center gap-3">
        {isRunning && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 animate-pulse" style={{ color: '#cc2200' }} />
              <span className="text-[10px] font-mono uppercase" style={{ color: '#cc4400' }}>Live</span>
            </div>
            {timerSeconds > 0 && (
              <span
                className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded"
                style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}
              >
                {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:{String(timerSeconds % 60).padStart(2, '0')}
              </span>
            )}
          </div>
        )}
        {missionId && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded"
            style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.15)' }}
          >
            <span className="text-[9px] font-mono uppercase" style={{ color: textMain }}>ID:</span>
            <span className="text-[10px] font-mono font-bold" style={{ color: '#C9A84C' }}>{missionId}</span>
          </div>
        )}
      </div>

      {/* Right: controls + clock */}
      <div className="flex items-center gap-2">
        {/* Font size toggle */}
        <div className="flex items-center rounded overflow-hidden" style={{ border: `1px solid ${bdr}` }}>
          {['sm','md','lg'].map((s) => (
            <button
              key={s}
              onClick={() => onFontSize(s)}
              className="px-2 py-1 text-[10px] font-mono font-bold transition-colors"
              style={{
                background: fontSize === s
                  ? (isLight ? 'rgba(201,168,76,0.2)' : 'rgba(201,168,76,0.15)')
                  : 'transparent',
                color: fontSize === s ? '#C9A84C' : textMain,
                borderRight: s !== 'lg' ? `1px solid ${bdr}` : 'none',
              }}
              title={`Font size: ${s}`}
            >
              {FONT_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Focus Mode */}
        <button
          style={iconBtn}
          onClick={onFocusMode}
          title="Focus Mode (⌘F)"
          onMouseEnter={(e) => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = textMain; e.currentTarget.style.borderColor = bdr; }}
        >
          <Maximize2 style={{ width: 13, height: 13 }} />
        </button>

        {/* Keyboard shortcuts */}
        <button
          style={iconBtn}
          onClick={onKeyboardShortcuts}
          title="Keyboard shortcuts (⌘/)"
          onMouseEnter={(e) => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = textMain; e.currentTarget.style.borderColor = bdr; }}
        >
          <Keyboard style={{ width: 13, height: 13 }} />
        </button>

        {/* Theme toggle */}
        <button
          style={{
            ...iconBtn,
            background: isLight ? 'rgba(201,168,76,0.1)' : 'rgba(201,168,76,0.07)',
            borderColor: 'rgba(201,168,76,0.3)',
            color: '#C9A84C',
          }}
          onClick={onToggleTheme}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {isLight ? <Moon style={{ width: 13, height: 13 }} /> : <Sun style={{ width: 13, height: 13 }} />}
        </button>

        {/* Clock */}
        <div className="text-right hidden md:block">
          <p className="text-[9px] font-mono leading-none" style={{ color: textDim }}>{militaryDate()}</p>
          <p className="text-[10px] font-mono font-semibold leading-none mt-0.5" style={{ color: textDim }}>{time}</p>
        </div>
        <div className="w-px h-4 hidden md:block" style={{ background: bdr }} />
        <div className="items-center gap-1 hidden md:flex">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ade80', boxShadow: '0 0 4px #4ade8060' }} />
          <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: isLight ? '#7aaa7a' : '#2a5a2a' }}>Secure</span>
        </div>
      </div>
    </header>
  );
}
