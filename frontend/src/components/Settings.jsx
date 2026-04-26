import React, { useState } from 'react';
import { X, RotateCcw, Save, Settings as SettingsIcon, AlertTriangle } from 'lucide-react';
import { AGENT_META } from './BoardroomTable.jsx';

// Default system prompts — must match backend DEFAULT_AGENTS
export const DEFAULT_AGENT_CONFIGS = {
  director: {
    name: 'Director',
    role: 'Manager',
    personality: 'Decisive, professional, executive tone. Think CEO addressing the board.',
    systemPrompt: `You are Director, the decisive executive AI orchestrating a high-performance boardroom of AI specialists. Your tone is authoritative, concise, and professional — think CEO addressing the board.

When kicking off a session: Frame the objective clearly in 2-3 powerful sentences. Set the mission. Be commanding.

When delivering the final executive verdict: Synthesize all team inputs into a clear, definitive conclusion with 3-5 concrete numbered next steps. No fluff. Maximum impact.

Format your kickoff starting with: "MISSION BRIEF:"
Format your final verdict starting with: "EXECUTIVE VERDICT:" then "NEXT STEPS:"`,
  },
  architect: {
    name: 'Architect',
    role: 'Prompt Engineer',
    personality: 'Precise, technical, methodical. Every word earns its place.',
    systemPrompt: `You are Architect, the meticulous AI prompt engineer obsessed with precision and structure. You transform vague requests into perfectly engineered prompts that unlock maximum AI performance.

Your output format:
**OBJECTIVE:** [Clear, single-sentence goal]
**CONTEXT:** [Relevant background and constraints]
**REQUIREMENTS:** [Specific deliverables as bullet list]
**SUCCESS CRITERIA:** [How we measure a great outcome]
**OPTIMIZED PROMPT:** [The refined, production-ready prompt]

Be thorough but surgical. Every word earns its place.`,
  },
  spark: {
    name: 'Spark',
    role: 'Brainstormer',
    personality: 'Energetic, creative, thinks outside the box. Makes people say "I never thought of that."',
    systemPrompt: `You are Spark, the explosive creative force of the boardroom. You see angles others miss and generate ideas that make people say "I never thought of that." Your energy is electric, your thinking is lateral, and you push past the obvious.

Generate exactly 3-5 distinct creative approaches. Number and name each one boldly.

Format each idea as:
**IDEA [N]: [Catchy Name]**
[2-3 sentences explaining the approach and why it's powerful]

Make each idea genuinely distinct — different angles, different assumptions challenged. Surprise us.`,
  },
  stack: {
    name: 'Stack',
    role: 'Developer',
    personality: 'Analytical, detail-oriented, pragmatic. Recommends what works, not what\'s fashionable.',
    systemPrompt: `You are Stack, the full-stack technical authority. You think in systems, trade-offs, and elegant implementations. You're pragmatic — you recommend what actually works, not what's fashionable.

Your output format:
**ARCHITECTURE RECOMMENDATION:** [The right approach and why]
**TECH CHOICES:** [Stack/tools/libraries with brief justification]
**KEY IMPLEMENTATION NOTES:** [Critical decisions as 3-5 bullets]
**RISKS & MITIGATIONS:** [What could go wrong and how to prevent it]
**CODE SNIPPET:** [A relevant example if applicable, in a code block]

Be specific. Vague advice is worthless.`,
  },
  memo: {
    name: 'Memo',
    role: 'Scribe',
    personality: 'Organized, concise, clear. Extracts signal from noise with surgical precision.',
    systemPrompt: `You are Memo, the master synthesizer who turns complex discussions into crystal-clear records. You extract signal from noise with surgical precision. If it's not essential, it doesn't make the notes.

Your output format:
**KEY DECISIONS:**
• [Decision 1]
• [Decision 2]

**CORE INSIGHTS:**
• [Insight 1]
• [Insight 2]

**ACTION ITEMS:**
1. [Action with priority]
2. [Action]

**OPEN QUESTIONS:**
• [Unresolved questions that need answers]

Be ruthlessly concise. Bullet points only.`,
  },
  sharp: {
    name: 'Sharp',
    role: 'Editor',
    personality: 'Critical, thorough, high standards. Pairs every weakness with a fix.',
    systemPrompt: `You are Sharp, the uncompromising quality officer who holds the boardroom to its highest standards. You see gaps, weak assumptions, and missed opportunities — and you call them out directly while offering precise improvements.

Your output format:
**WHAT'S WORKING:**
• [Genuine strengths, be specific]

**CRITICAL GAPS:**
• [Weakness 1 + specific fix]
• [Weakness 2 + specific fix]

**ELEVATED RECOMMENDATIONS:**
[2-3 paragraphs of your sharpened, improved version of the key outputs]

**FINAL QUALITY VERDICT:** [One sentence: is this ready? What's the blocker?]

Be direct. Pair every weakness with a fix.`,
  },
};

function AgentEditCard({ agentKey, config, onChange, onReset }) {
  const meta  = AGENT_META.find((m) => m.key === agentKey);
  const color = meta?.color ?? '#C9A84C';
  const Icon  = meta?.icon;

  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: '#080f08',
        border:     `1px solid #1a3020`,
      }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}
            >
              <Icon style={{ color, width: 14, height: 14 }} />
            </div>
          )}
          <span className="text-xs font-mono font-bold" style={{ color: '#b8d8b8' }}>
            {config.name}
          </span>
        </div>
        <button
          onClick={() => onReset(agentKey)}
          className="text-[10px] font-mono flex items-center gap-1 px-2 py-0.5 rounded transition-colors hover:bg-white/5"
          style={{ color: '#3a5a3a', border: '1px solid #152015' }}
          title="Reset to default"
        >
          <RotateCcw style={{ width: 10, height: 10 }} />
          Reset
        </button>
      </div>

      {/* Name */}
      <div className="mb-2">
        <label className="text-[9px] font-mono uppercase tracking-widest block mb-1" style={{ color: '#3a5a3a' }}>
          Agent Name
        </label>
        <input
          value={config.name}
          onChange={(e) => onChange({ ...config, name: e.target.value })}
          className="w-full text-xs font-mono px-3 py-1.5 rounded outline-none transition-colors"
          style={{
            background:  '#0b1a0b',
            border:      '1px solid #1a3020',
            color:       '#b8d8b8',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#C9A84C80'; }}
          onBlur={(e)  => { e.target.style.borderColor = '#1a3020'; }}
        />
      </div>

      {/* Role */}
      <div className="mb-2">
        <label className="text-[9px] font-mono uppercase tracking-widest block mb-1" style={{ color: '#3a5a3a' }}>
          Role Title
        </label>
        <input
          value={config.role}
          onChange={(e) => onChange({ ...config, role: e.target.value })}
          className="w-full text-xs font-mono px-3 py-1.5 rounded outline-none"
          style={{ background: '#0b1a0b', border: '1px solid #1a3020', color: '#b8d8b8' }}
          onFocus={(e) => { e.target.style.borderColor = '#C9A84C80'; }}
          onBlur={(e)  => { e.target.style.borderColor = '#1a3020'; }}
        />
      </div>

      {/* Personality */}
      <div className="mb-2">
        <label className="text-[9px] font-mono uppercase tracking-widest block mb-1" style={{ color: '#3a5a3a' }}>
          Personality
        </label>
        <textarea
          value={config.personality}
          onChange={(e) => onChange({ ...config, personality: e.target.value })}
          rows={2}
          className="w-full text-xs font-mono px-3 py-1.5 rounded outline-none resize-none"
          style={{ background: '#0b1a0b', border: '1px solid #1a3020', color: '#b8d8b8' }}
          onFocus={(e) => { e.target.style.borderColor = '#C9A84C80'; }}
          onBlur={(e)  => { e.target.style.borderColor = '#1a3020'; }}
        />
      </div>

      {/* System prompt toggle */}
      <button
        onClick={() => setShowPrompt((v) => !v)}
        className="text-[9px] font-mono uppercase tracking-widest flex items-center gap-1 mb-2 transition-colors"
        style={{ color: showPrompt ? '#C9A84C' : '#3a5a3a' }}
      >
        <span>{showPrompt ? '▾' : '▸'}</span>
        System Prompt {showPrompt ? '(hide)' : '(edit)'}
      </button>

      {showPrompt && (
        <textarea
          value={config.systemPrompt}
          onChange={(e) => onChange({ ...config, systemPrompt: e.target.value })}
          rows={8}
          className="w-full text-[11px] font-mono px-3 py-2 rounded outline-none resize-y"
          style={{
            background:  '#060c06',
            border:      '1px solid #1a3020',
            color:       '#7a9a7a',
            lineHeight:  1.6,
          }}
          onFocus={(e) => { e.target.style.borderColor = '#C9A84C50'; }}
          onBlur={(e)  => { e.target.style.borderColor = '#1a3020'; }}
        />
      )}
    </div>
  );
}

export default function Settings({ configs, onSave, onClose }) {
  const [local, setLocal] = useState(() => JSON.parse(JSON.stringify(configs)));
  const [saved, setSaved]  = useState(false);

  const handleChange = (key, updated) => {
    setLocal((prev) => ({ ...prev, [key]: updated }));
    setSaved(false);
  };

  const handleReset = (key) => {
    setLocal((prev) => ({ ...prev, [key]: { ...DEFAULT_AGENT_CONFIGS[key] } }));
    setSaved(false);
  };

  const handleResetAll = () => {
    setLocal(JSON.parse(JSON.stringify(DEFAULT_AGENT_CONFIGS)));
    setSaved(false);
  };

  const handleSave = () => {
    onSave(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col rounded-xl overflow-hidden"
        style={{
          width: '90vw', maxWidth: '900px',
          maxHeight: '90vh',
          background: '#060e06',
          border: '1px solid #1a3020',
          boxShadow: '0 40px 120px rgba(0,0,0,0.9)',
        }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #152015', background: '#070f07' }}
        >
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-4 h-4" style={{ color: '#C9A84C' }} />
            <div>
              <h2 className="text-sm font-bold font-mono tracking-widest uppercase" style={{ color: '#b8d8b8' }}>
                Agent Configuration
              </h2>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: '#3a5a3a' }}>
                Authorized personnel only — changes saved to local storage
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge-classified">TOP SECRET</span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ color: '#527052' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Warning bar */}
        <div
          className="flex items-center gap-2 px-6 py-2 flex-shrink-0"
          style={{ background: 'rgba(201,168,76,0.06)', borderBottom: '1px solid rgba(201,168,76,0.1)' }}
        >
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
          <p className="text-[10px] font-mono" style={{ color: 'rgba(201,168,76,0.7)' }}>
            Editing system prompts will change agent behaviour. Custom prompts are sent to the backend on each mission.
          </p>
        </div>

        {/* Agent cards grid */}
        <div className="overflow-y-auto flex-1 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(DEFAULT_AGENT_CONFIGS).map((key) => (
              <AgentEditCard
                key={key}
                agentKey={key}
                config={local[key]}
                onChange={(updated) => handleChange(key, updated)}
                onReset={handleReset}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid #152015', background: '#050c05' }}
        >
          <button
            onClick={handleResetAll}
            className="flex items-center gap-2 px-4 py-2 rounded text-xs font-mono transition-all"
            style={{
              color:   '#3a5a3a',
              border:  '1px solid #1a3020',
              background: 'transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#527052'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#3a5a3a'; }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All to Defaults
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-xs font-mono"
              style={{ color: '#527052', border: '1px solid #1a3020' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded text-xs font-mono font-bold transition-all"
              style={{
                background: saved ? 'rgba(74,222,128,0.15)' : 'rgba(201,168,76,0.15)',
                border:     `1px solid ${saved ? 'rgba(74,222,128,0.4)' : 'rgba(201,168,76,0.4)'}`,
                color:       saved ? '#4ade80' : '#C9A84C',
              }}
            >
              {saved ? (
                <><span>✓</span> Saved</>
              ) : (
                <><Save className="w-3.5 h-3.5" /> Save Configuration</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
