import React, { useState } from 'react';
import { X, RotateCcw, Save, Settings as SettingsIcon, AlertTriangle, User, Link2 } from 'lucide-react';
import { AGENT_META } from './BoardroomTable.jsx';

export const DEFAULT_AGENT_CONFIGS = {
  director: {
    name: 'Director', role: 'Manager', avatar: '',
    personality: 'Decisive, professional, executive tone. Think CEO addressing the board.',
    systemPrompt: `You are Director, the decisive executive AI orchestrating a high-performance boardroom of AI specialists. Your tone is authoritative, concise, and professional — think CEO addressing the board.

When kicking off a session: Frame the objective clearly in 2-3 powerful sentences. Set the mission. Be commanding.

When delivering the final executive verdict: Synthesize all team inputs into a clear, definitive conclusion with 3-5 concrete numbered next steps. No fluff. Maximum impact.

Format your kickoff starting with: "MISSION BRIEF:"
Format your final verdict starting with: "EXECUTIVE VERDICT:" then "NEXT STEPS:"

IMPORTANT: Always end your FINAL EXECUTIVE VERDICT with this section formatted exactly as shown:

CLAUDE CODE PROMPT:
[Write a comprehensive, ready-to-use prompt a developer can paste directly into Claude Code. Include: the specific implementation task, full technical context, requirements from Architect, creative approaches from Spark, technical stack from Stack, key decisions from Memo, and quality criteria from Sharp. One cohesive, actionable prompt.]`,
  },
  architect: {
    name: 'Architect', role: 'Prompt Engineer', avatar: '',
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
    name: 'Spark', role: 'Brainstormer', avatar: '',
    personality: 'Energetic, creative, thinks outside the box.',
    systemPrompt: `You are Spark, the explosive creative force of the boardroom. You see angles others miss and generate ideas that make people say "I never thought of that."

Generate exactly 3-5 distinct creative approaches. Number and name each one boldly.

Format each idea as:
**IDEA [N]: [Catchy Name]**
[2-3 sentences explaining the approach and why it's powerful]

Make each idea genuinely distinct. Surprise us.`,
  },
  stack: {
    name: 'Stack', role: 'Developer', avatar: '',
    personality: 'Analytical, pragmatic. Recommends what works, not what\'s fashionable.',
    systemPrompt: `You are Stack, the full-stack technical authority. You think in systems, trade-offs, and elegant implementations.

Your output format:
**ARCHITECTURE RECOMMENDATION:** [The right approach and why]
**TECH CHOICES:** [Stack/tools/libraries with brief justification]
**KEY IMPLEMENTATION NOTES:** [Critical decisions as 3-5 bullets]
**RISKS & MITIGATIONS:** [What could go wrong and how to prevent it]
**CODE SNIPPET:** [A relevant example if applicable, in a code block]

Be specific. Vague advice is worthless.`,
  },
  memo: {
    name: 'Memo', role: 'Scribe', avatar: '',
    personality: 'Organized, concise. Extracts signal from noise.',
    systemPrompt: `You are Memo, the master synthesizer who turns complex discussions into crystal-clear records.

Your output format:
**KEY DECISIONS:**
• [Decision 1]

**CORE INSIGHTS:**
• [Insight 1]

**ACTION ITEMS:**
1. [Action with priority]

**OPEN QUESTIONS:**
• [Unresolved questions]

Be ruthlessly concise. Bullet points only.`,
  },
  sharp: {
    name: 'Sharp', role: 'Editor', avatar: '',
    personality: 'Critical, thorough, high standards. Pairs every weakness with a fix.',
    systemPrompt: `You are Sharp, the uncompromising quality officer who holds the boardroom to its highest standards.

Your output format:
**WHAT'S WORKING:**
• [Genuine strengths]

**CRITICAL GAPS:**
• [Weakness + specific fix]

**ELEVATED RECOMMENDATIONS:**
[2-3 paragraphs of your sharpened version]

**FINAL QUALITY VERDICT:** [One sentence: ready or not?]

Be direct. Pair every weakness with a fix.`,
  },
};

export const DEFAULT_AGENCY_PROFILE = {
  enabled: true,
  operatorName: 'Andrew',
  agencyName: 'Andrews Express Agency',
  techStack: 'Lovable, Make.com, Supabase, Twilio, OpenAI, Claude, DigitalOcean',
  clients: 'Mike Seidel - Classic Glass, Ana Marchante - Realtor, David - Fitness App',
  notes: '',
};

export const DEFAULT_EMAIL_SETTINGS   = { recipientEmail: 'replies@andrewexpressagency.com' };
export const DEFAULT_NOTION_SETTINGS  = { apiKey: '', databaseId: '' };

const AVATAR_OPTIONS = ['', '👑', '🧠', '⚡', '🔧', '📋', '✂️', '🚀', '💡', '🎯', '🌟', '🤖', '🦅', '🔮', '⚙️', '👤'];

// ── Agent card ────────────────────────────────────────────────────────────────
function AgentEditCard({ agentKey, config, onChange, onReset }) {
  const meta  = AGENT_META.find(m => m.key === agentKey);
  const color = meta?.color ?? '#C9A84C';
  const Icon  = meta?.icon;
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <div className="rounded-lg p-4" style={{ background: '#080f08', border: '1px solid #1a3020' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: `${color}18`, border: `1px solid ${color}30` }}
          >
            {config.avatar
              ? <span style={{ fontSize: 16, lineHeight: 1 }}>{config.avatar}</span>
              : Icon && <Icon style={{ color, width: 14, height: 14 }} />}
          </div>
          <span className="text-xs font-mono font-bold" style={{ color: '#b8d8b8' }}>{config.name}</span>
        </div>
        <button onClick={() => onReset(agentKey)}
          className="text-[10px] font-mono flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/5"
          style={{ color: '#3a5a3a', border: '1px solid #152015' }}
          title="Reset to default"
        >
          <RotateCcw style={{ width: 10, height: 10 }} /> Reset
        </button>
      </div>

      {/* Avatar picker */}
      <div className="mb-3">
        <label className="text-[9px] font-mono uppercase tracking-widest block mb-1.5" style={{ color: '#3a5a3a' }}>Avatar</label>
        <div className="flex flex-wrap gap-1">
          {AVATAR_OPTIONS.map(emoji => (
            <button key={emoji || 'default'} onClick={() => onChange({ ...config, avatar: emoji })}
              className="w-7 h-7 rounded flex items-center justify-center text-sm transition-all"
              style={{
                border: `1px solid ${config.avatar === emoji ? color : '#1a3020'}`,
                background: config.avatar === emoji ? `${color}18` : 'transparent',
              }}
              title={emoji || 'Default icon'}
            >
              {emoji || <Icon style={{ color: '#3a5a3a', width: 12, height: 12 }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Name / Role */}
      {[['Agent Name', 'name'], ['Role Title', 'role']].map(([label, field]) => (
        <div key={field} className="mb-2">
          <label className="text-[9px] font-mono uppercase tracking-widest block mb-1" style={{ color: '#3a5a3a' }}>{label}</label>
          <input value={config[field]} onChange={e => onChange({ ...config, [field]: e.target.value })}
            className="w-full text-xs font-mono px-3 py-1.5 rounded outline-none"
            style={{ background: '#0b1a0b', border: '1px solid #1a3020', color: '#b8d8b8' }}
            onFocus={e => { e.target.style.borderColor = '#C9A84C80'; }}
            onBlur={e  => { e.target.style.borderColor = '#1a3020'; }}
          />
        </div>
      ))}

      {/* System prompt toggle */}
      <button onClick={() => setShowPrompt(v => !v)}
        className="text-[9px] font-mono uppercase tracking-widest flex items-center gap-1 mb-2"
        style={{ color: showPrompt ? '#C9A84C' : '#3a5a3a' }}
      >
        <span>{showPrompt ? '▾' : '▸'}</span> System Prompt {showPrompt ? '(hide)' : '(edit)'}
      </button>
      {showPrompt && (
        <textarea value={config.systemPrompt} onChange={e => onChange({ ...config, systemPrompt: e.target.value })}
          rows={7}
          className="w-full text-[11px] font-mono px-3 py-2 rounded outline-none resize-y"
          style={{ background: '#060c06', border: '1px solid #1a3020', color: '#7a9a7a', lineHeight: 1.6 }}
          onFocus={e => { e.target.style.borderColor = '#C9A84C50'; }}
          onBlur={e  => { e.target.style.borderColor = '#1a3020'; }}
        />
      )}
    </div>
  );
}

// ── Agency profile tab ────────────────────────────────────────────────────────
function AgencyTab({ profile, onChange }) {
  const field = (label, key, multiline = false, rows = 2) => (
    <div className="mb-4">
      <label className="text-[9px] font-mono uppercase tracking-widest block mb-1.5" style={{ color: '#3a5a3a' }}>{label}</label>
      {multiline ? (
        <textarea value={profile[key] || ''} onChange={e => onChange({ ...profile, [key]: e.target.value })}
          rows={rows}
          className="w-full text-xs font-mono px-3 py-2 rounded outline-none resize-none"
          style={{ background: '#0b1a0b', border: '1px solid #1a3020', color: '#b8d8b8', lineHeight: 1.6 }}
          onFocus={e => { e.target.style.borderColor = '#C9A84C80'; }}
          onBlur={e  => { e.target.style.borderColor = '#1a3020'; }}
        />
      ) : (
        <input value={profile[key] || ''} onChange={e => onChange({ ...profile, [key]: e.target.value })}
          className="w-full text-xs font-mono px-3 py-1.5 rounded outline-none"
          style={{ background: '#0b1a0b', border: '1px solid #1a3020', color: '#b8d8b8' }}
          onFocus={e => { e.target.style.borderColor = '#C9A84C80'; }}
          onBlur={e  => { e.target.style.borderColor = '#1a3020'; }}
        />
      )}
    </div>
  );

  return (
    <div className="p-5 max-w-lg">
      <div className="flex items-center gap-2 mb-5 p-3 rounded-lg"
        style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)' }}
      >
        <div className="flex items-center gap-2 flex-1">
          <span className="text-[10px] font-mono" style={{ color: 'rgba(201,168,76,0.7)' }}>
            Inject agency context into all agent system prompts
          </span>
        </div>
        <button
          onClick={() => onChange({ ...profile, enabled: !profile.enabled })}
          className="px-3 py-1 rounded text-[10px] font-mono font-bold transition-all"
          style={{
            background: profile.enabled ? 'rgba(74,222,128,0.15)' : 'rgba(0,0,0,0.3)',
            border: `1px solid ${profile.enabled ? 'rgba(74,222,128,0.4)' : '#1a3020'}`,
            color: profile.enabled ? '#4ade80' : '#3a5a3a',
          }}
        >
          {profile.enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {field('Your Name', 'operatorName')}
      {field('Agency Name', 'agencyName')}
      {field('Tech Stack', 'techStack', true, 2)}
      {field('Current Clients', 'clients', true, 3)}
      {field('Additional Context / Notes', 'notes', true, 3)}
    </div>
  );
}

// ── Integrations tab ──────────────────────────────────────────────────────────
function IntegrationsTab({ emailSettings, notionSettings, onEmailChange, onNotionChange }) {
  const input = (value, onChange, placeholder, type = 'text') => (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
      className="w-full text-xs font-mono px-3 py-1.5 rounded outline-none"
      style={{ background: '#0b1a0b', border: '1px solid #1a3020', color: '#b8d8b8' }}
      onFocus={e => { e.target.style.borderColor = '#C9A84C80'; }}
      onBlur={e  => { e.target.style.borderColor = '#1a3020'; }}
    />
  );

  return (
    <div className="p-5 space-y-6 max-w-lg">
      {/* Email */}
      <div>
        <h3 className="text-xs font-mono font-bold mb-3 flex items-center gap-2" style={{ color: '#b8d8b8' }}>
          <span style={{ fontSize: 14 }}>✉️</span> Email Settings
        </h3>
        <div className="rounded-lg p-4" style={{ background: '#080f08', border: '1px solid #1a3020' }}>
          <label className="text-[9px] font-mono uppercase tracking-widest block mb-1.5" style={{ color: '#3a5a3a' }}>
            Default Recipient Email
          </label>
          {input(emailSettings.recipientEmail, v => onEmailChange({ ...emailSettings, recipientEmail: v }), 'your@email.com', 'email')}
          <p className="text-[10px] font-mono mt-2" style={{ color: '#2a4a2a' }}>
            Used by the "Email Summary" action button — opens your mail client pre-filled.
          </p>
        </div>
      </div>

      {/* Notion */}
      <div>
        <h3 className="text-xs font-mono font-bold mb-3 flex items-center gap-2" style={{ color: '#b8d8b8' }}>
          <span style={{ fontSize: 14 }}>📝</span> Notion Integration
        </h3>
        <div className="rounded-lg p-4 space-y-3" style={{ background: '#080f08', border: '1px solid #1a3020' }}>
          <div>
            <label className="text-[9px] font-mono uppercase tracking-widest block mb-1.5" style={{ color: '#3a5a3a' }}>
              Notion Integration Token
            </label>
            {input(notionSettings.apiKey, v => onNotionChange({ ...notionSettings, apiKey: v }), 'secret_…', 'password')}
          </div>
          <div>
            <label className="text-[9px] font-mono uppercase tracking-widest block mb-1.5" style={{ color: '#3a5a3a' }}>
              Database ID
            </label>
            {input(notionSettings.databaseId, v => onNotionChange({ ...notionSettings, databaseId: v }), '32-char database ID')}
          </div>
          <p className="text-[10px] font-mono" style={{ color: '#2a4a2a' }}>
            Create an integration at notion.so/my-integrations and share your database with it.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Settings modal ───────────────────────────────────────────────────────
export default function Settings({
  configs, onSave, onClose,
  agencyProfile, emailSettings, notionSettings,
}) {
  const [tab,         setTab]         = useState('agents');
  const [localAgents, setLocalAgents] = useState(() => JSON.parse(JSON.stringify(configs)));
  const [localAgency, setLocalAgency] = useState(() => ({ ...DEFAULT_AGENCY_PROFILE, ...agencyProfile }));
  const [localEmail,  setLocalEmail]  = useState(() => ({ ...DEFAULT_EMAIL_SETTINGS,  ...emailSettings }));
  const [localNotion, setLocalNotion] = useState(() => ({ ...DEFAULT_NOTION_SETTINGS, ...notionSettings }));
  const [saved,       setSaved]       = useState(false);

  const handleSave = () => {
    onSave({ configs: localAgents, agencyProfile: localAgency, emailSettings: localEmail, notionSettings: localNotion });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabBtn = (id, label) => ({
    style: {
      padding: '6px 14px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
      cursor: 'pointer', border: 'none',
      color: tab === id ? '#C9A84C' : '#3a5a3a',
      borderBottom: tab === id ? '2px solid #C9A84C' : '2px solid transparent',
      background: 'transparent', transition: 'all 0.15s',
    },
    onClick: () => setTab(id),
    children: label,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex flex-col rounded-xl overflow-hidden"
        style={{
          width: '90vw', maxWidth: '920px', maxHeight: '90vh',
          background: '#060e06', border: '1px solid #1a3020',
          boxShadow: '0 40px 120px rgba(0,0,0,0.9)',
        }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #152015', background: '#070f07' }}
        >
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-4 h-4" style={{ color: '#C9A84C' }} />
            <h2 className="text-sm font-bold font-mono tracking-widest uppercase" style={{ color: '#b8d8b8' }}>
              Configuration
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge-classified">TOP SECRET</span>
            <button onClick={onClose}
              className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/10"
              style={{ color: '#527052' }}
            ><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex flex-shrink-0 px-6" style={{ borderBottom: '1px solid #152015', gap: 0 }}>
          <button {...tabBtn('agents', '⚙ Agents')} />
          <button {...tabBtn('agency', '🏢 Agency Profile')} />
          <button {...tabBtn('integrations', '🔗 Integrations')} />
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto flex-1">
          {tab === 'agents' && (
            <>
              <div className="flex items-center gap-2 px-6 py-2 flex-shrink-0"
                style={{ background: 'rgba(201,168,76,0.06)', borderBottom: '1px solid rgba(201,168,76,0.1)' }}
              >
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
                <p className="text-[10px] font-mono" style={{ color: 'rgba(201,168,76,0.7)' }}>
                  Custom prompts are sent to the backend on each mission. Avatar changes apply immediately.
                </p>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.keys(DEFAULT_AGENT_CONFIGS).map(key => (
                  <AgentEditCard
                    key={key} agentKey={key} config={localAgents[key]}
                    onChange={updated => setLocalAgents(prev => ({ ...prev, [key]: updated }))}
                    onReset={k => setLocalAgents(prev => ({ ...prev, [k]: { ...DEFAULT_AGENT_CONFIGS[k] } }))}
                  />
                ))}
              </div>
            </>
          )}
          {tab === 'agency' && (
            <AgencyTab profile={localAgency} onChange={setLocalAgency} />
          )}
          {tab === 'integrations' && (
            <IntegrationsTab
              emailSettings={localEmail} notionSettings={localNotion}
              onEmailChange={setLocalEmail} onNotionChange={setLocalNotion}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid #152015', background: '#050c05' }}
        >
          {tab === 'agents' && (
            <button onClick={() => setLocalAgents(JSON.parse(JSON.stringify(DEFAULT_AGENT_CONFIGS)))}
              className="flex items-center gap-2 px-4 py-2 rounded text-xs font-mono"
              style={{ color: '#3a5a3a', border: '1px solid #1a3020', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#527052'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#3a5a3a'; }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset All Agents
            </button>
          )}
          {tab !== 'agents' && <div />}

          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded text-xs font-mono"
              style={{ color: '#527052', border: '1px solid #1a3020' }}
            >Cancel</button>
            <button onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded text-xs font-mono font-bold"
              style={{
                background: saved ? 'rgba(74,222,128,0.15)' : 'rgba(201,168,76,0.15)',
                border: `1px solid ${saved ? 'rgba(74,222,128,0.4)' : 'rgba(201,168,76,0.4)'}`,
                color: saved ? '#4ade80' : '#C9A84C',
              }}
            >
              {saved ? <><span>✓</span> Saved!</> : <><Save className="w-3.5 h-3.5" /> Save All</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
