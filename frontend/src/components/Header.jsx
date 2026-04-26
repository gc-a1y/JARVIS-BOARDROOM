import React, { useState, useEffect } from 'react';
import { Shield, Radio } from 'lucide-react';

function zeroPad(n) {
  return String(n).padStart(2, '0');
}

function militaryTime() {
  const d = new Date();
  return `${zeroPad(d.getUTCHours())}${zeroPad(d.getUTCMinutes())}${zeroPad(d.getUTCSeconds())}Z`;
}

function militaryDate() {
  const d   = new Date();
  const mon = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${zeroPad(d.getUTCDate())}${mon[d.getUTCMonth()]}${d.getUTCFullYear()}`;
}

export default function Header({ missionId, isRunning }) {
  const [time, setTime] = useState(militaryTime);

  useEffect(() => {
    const t = setInterval(() => setTime(militaryTime()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header
      className="flex items-center justify-between px-5 py-2.5 flex-shrink-0"
      style={{
        background:  '#050d05',
        borderBottom: '1px solid #1a3020',
        minHeight:   '44px',
      }}
    >
      {/* Left: branding + classified badge */}
      <div className="flex items-center gap-4">
        {/* Traffic light dots */}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#cc2200' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#cc6600' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#1a8020' }} />
        </div>

        <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C9A84C' }} />

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold tracking-[0.3em] uppercase" style={{ color: '#C9A84C' }}>
            JARVIS BOARD
          </span>
          <span className="text-xs font-mono" style={{ color: '#1a4020' }}>—</span>
          <span className="text-xs font-mono tracking-widest uppercase" style={{ color: '#3a6040' }}>
            Classified Operations
          </span>
        </div>

        <span className="badge-classified">CONFIDENTIAL</span>
      </div>

      {/* Center: mission ID */}
      <div className="flex items-center gap-4">
        {isRunning && (
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 animate-pulse" style={{ color: '#cc2200' }} />
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#cc4400' }}>
              Live
            </span>
          </div>
        )}

        {missionId && (
          <div className="flex items-center gap-2 px-3 py-1 rounded" style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.15)' }}>
            <span className="text-[9px] font-mono uppercase" style={{ color: '#527052' }}>
              MISSION ID:
            </span>
            <span className="text-[11px] font-mono font-bold" style={{ color: '#C9A84C' }}>
              {missionId}
            </span>
          </div>
        )}
      </div>

      {/* Right: timestamp */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[10px] font-mono leading-none" style={{ color: '#527052' }}>
            {militaryDate()}
          </p>
          <p className="text-[11px] font-mono font-semibold leading-none mt-0.5" style={{ color: '#3a6040' }}>
            {time}
          </p>
        </div>
        <div className="w-px h-5" style={{ background: '#1a3020' }} />
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#4ade80', boxShadow: '0 0 4px #4ade8060' }}
          />
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#2a5a2a' }}>
            Secure
          </span>
        </div>
      </div>
    </header>
  );
}
