import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const LS_KEY = 'jarvis-templates';

const DEFAULTS = [
  { id: 'build-app',     label: 'Build Client App',        text: 'I need to build a full stack app for a client that ' },
  { id: 'plan-service',  label: 'Plan New Service',         text: 'Help me plan a new service offering for my agency including pricing, deliverables, and target clients. The service is: ' },
  { id: 'claude-prompt', label: 'Write Claude Code Prompt', text: 'Generate a complete Claude Code prompt to build ' },
  { id: 'proposal',      label: 'Client Proposal',          text: 'Create a professional proposal for a client who needs ' },
  { id: 'morning',       label: 'Morning Briefing',         text: 'Morning.' },
];

export default function MissionTemplates({ onSelect, isLight }) {
  const [custom, setCustom] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
  });
  const [showAdd,   setShowAdd]   = useState(false);
  const [newLabel,  setNewLabel]  = useState('');
  const [newText,   setNewText]   = useState('');

  const border = isLight ? '#d4c8a0' : '#1a3020';
  const dim    = isLight ? '#9a9070' : '#3a5a3a';
  const btnColor = isLight ? '#5a5030' : '#527052';

  const btn = {
    padding: '3px 9px', borderRadius: 4, fontSize: 10,
    fontFamily: 'monospace', fontWeight: 600, cursor: 'pointer',
    border: `1px solid ${border}`, background: 'transparent',
    color: btnColor, transition: 'all 0.15s', whiteSpace: 'nowrap',
  };

  const saveCustom = () => {
    if (!newLabel.trim() || !newText.trim()) return;
    const t = { id: `c-${Date.now()}`, label: newLabel.trim(), text: newText.trim() };
    const next = [...custom, t];
    setCustom(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    setNewLabel(''); setNewText(''); setShowAdd(false);
  };

  const deleteCustom = (id) => {
    const next = custom.filter(t => t.id !== id);
    setCustom(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[9px] font-mono uppercase tracking-widest flex-shrink-0" style={{ color: dim }}>
          Templates:
        </span>

        {DEFAULTS.map(t => (
          <button key={t.id} style={btn}
            onClick={() => onSelect(t.text)}
            onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = btnColor; e.currentTarget.style.borderColor = border; }}
          >{t.label}</button>
        ))}

        {custom.map(t => (
          <span key={t.id} className="flex items-center" style={{ gap: 0 }}>
            <button style={btn}
              onClick={() => onSelect(t.text)}
              onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = btnColor; e.currentTarget.style.borderColor = border; }}
            >{t.label}</button>
            <button
              onClick={() => deleteCustom(t.id)}
              style={{ ...btn, padding: '3px 5px', borderLeft: 'none', borderRadius: '0 4px 4px 0', marginLeft: -1 }}
              title="Remove"
            ><X style={{ width: 9, height: 9 }} /></button>
          </span>
        ))}

        <button
          style={{ ...btn, color: '#C9A84C80', borderColor: 'rgba(201,168,76,0.2)', padding: '3px 6px' }}
          onClick={() => setShowAdd(v => !v)}
          title="Add custom template"
        ><Plus style={{ width: 10, height: 10 }} /></button>
      </div>

      {showAdd && (
        <div className="mt-2 flex gap-2 items-center p-2.5 rounded-lg"
          style={{ background: isLight ? '#f5f0e8' : '#070f07', border: `1px solid ${border}` }}
        >
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
            placeholder="Label" className="w-28 text-[11px] font-mono px-2 py-1 rounded outline-none"
            style={{ background: isLight ? '#fff' : '#0b1a0b', border: `1px solid ${border}`, color: isLight ? '#2a2518' : '#b8d8b8' }}
          />
          <input value={newText} onChange={e => setNewText(e.target.value)}
            placeholder="Mission text to pre-fill…" className="flex-1 text-[11px] font-mono px-2 py-1 rounded outline-none"
            style={{ background: isLight ? '#fff' : '#0b1a0b', border: `1px solid ${border}`, color: isLight ? '#2a2518' : '#b8d8b8' }}
            onKeyDown={e => { if (e.key === 'Enter') saveCustom(); }}
          />
          <button onClick={saveCustom}
            style={{ ...btn, color: '#C9A84C', borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.08)' }}
          >Save</button>
          <button onClick={() => setShowAdd(false)} style={btn}>Cancel</button>
        </div>
      )}
    </div>
  );
}
