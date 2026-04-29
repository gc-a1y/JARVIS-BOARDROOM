import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Tag, X } from 'lucide-react';
import Header from './components/Header.jsx';
import ConversationSidebar from './components/ConversationSidebar.jsx';
import InputPanel from './components/InputPanel.jsx';
import BoardroomTable from './components/BoardroomTable.jsx';
import AgentPanel from './components/AgentPanel.jsx';
import BoardSummary from './components/BoardSummary.jsx';
import Settings, {
  DEFAULT_AGENT_CONFIGS,
  DEFAULT_AGENCY_PROFILE,
  DEFAULT_EMAIL_SETTINGS,
  DEFAULT_NOTION_SETTINGS,
} from './components/Settings.jsx';
import ClaudeCodeModal from './components/ClaudeCodeModal.jsx';
import FocusMode from './components/FocusMode.jsx';
import KeyboardShortcuts from './components/KeyboardShortcuts.jsx';
import QuickActionsBar from './components/QuickActionsBar.jsx';
import SessionStats from './components/SessionStats.jsx';
import MissionTemplates from './components/MissionTemplates.jsx';
import ProjectPlan from './components/ProjectPlan.jsx';
import ProposalModal from './components/ProposalModal.jsx';
import MorningBriefing from './components/MorningBriefing.jsx';

// ── localStorage keys ─────────────────────────────────────────────────────────
const LS_CONFIGS_KEY  = 'jarvis-agent-configs';
const LS_LIBRARY_KEY  = 'jarvis-library';
const LS_LIGHT_KEY    = 'jarvis-light-mode';
const LS_FONTSIZE_KEY = 'jarvis-font-size';
const LS_PINNED_KEY   = 'jarvis-pinned-ids';
const LS_TAGS_KEY     = 'jarvis-mission-tags';
const LS_FAVS_KEY     = 'jarvis-favorites';
const LS_AGENCY_KEY   = 'jarvis-agency-profile';
const LS_EMAIL_KEY    = 'jarvis-email-settings';
const LS_NOTION_KEY   = 'jarvis-notion-settings';

const MORNING_RE = /^(good\s+)?morning[.!]?\s*$/i;

const INITIAL_AGENT_STATES = {
  director:  { status: 'idle', content: '', tokens: null, timestamp: null },
  architect: { status: 'idle', content: '', tokens: null, timestamp: null },
  spark:     { status: 'idle', content: '', tokens: null, timestamp: null },
  stack:     { status: 'idle', content: '', tokens: null, timestamp: null },
  memo:      { status: 'idle', content: '', tokens: null, timestamp: null },
  sharp:     { status: 'idle', content: '', tokens: null, timestamp: null },
};

function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

function loadConfigs() {
  const raw = lsGet(LS_CONFIGS_KEY, null);
  if (!raw) return JSON.parse(JSON.stringify(DEFAULT_AGENT_CONFIGS));
  const merged = {};
  for (const key of Object.keys(DEFAULT_AGENT_CONFIGS)) {
    merged[key] = { ...DEFAULT_AGENT_CONFIGS[key], ...(raw[key] ?? {}) };
  }
  return merged;
}

function getMissionTitle(request, agentOutputs) {
  const dir = agentOutputs?.director;
  if (dir) {
    const clean = dir.replace(/[#*`_~>]/g, '').trim();
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length) return words.slice(0, 6).join(' ') + (words.length > 6 ? '…' : '');
  }
  const words = request.trim().split(/\s+/);
  return words.slice(0, 6).join(' ') + (words.length > 6 ? '…' : '');
}

const TAG_PALETTE = ['#C9A84C', '#60a5fa', '#4ade80', '#f87171', '#a78bfa', '#fbbf24', '#34d399'];
function tagColor(tag) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = tag.charCodeAt(i) + ((h << 5) - h);
  return TAG_PALETTE[Math.abs(h) % TAG_PALETTE.length];
}

export default function App() {
  // ── Persistence / theme ───────────────────────────────────────────────────
  const [isLight,       setIsLight]       = useState(() => lsGet(LS_LIGHT_KEY, false));
  const [fontSize,      setFontSize]      = useState(() => lsGet(LS_FONTSIZE_KEY, 'md'));
  const [agentConfigs,  setAgentConfigs]  = useState(loadConfigs);
  const [library,       setLibrary]       = useState(() => lsGet(LS_LIBRARY_KEY, []));
  const [pinnedIds,     setPinnedIds]     = useState(() => new Set(lsGet(LS_PINNED_KEY, [])));
  const [missionTags,   setMissionTags]   = useState(() => lsGet(LS_TAGS_KEY, {}));
  const [favorites,     setFavorites]     = useState(() => lsGet(LS_FAVS_KEY, []));
  const [agencyProfile, setAgencyProfile] = useState(() => ({ ...DEFAULT_AGENCY_PROFILE, ...lsGet(LS_AGENCY_KEY, {}) }));
  const [emailSettings, setEmailSettings] = useState(() => ({ ...DEFAULT_EMAIL_SETTINGS,  ...lsGet(LS_EMAIL_KEY, {}) }));
  const [notionSettings,setNotionSettings]= useState(() => ({ ...DEFAULT_NOTION_SETTINGS, ...lsGet(LS_NOTION_KEY, {}) }));

  // ── Core session state ────────────────────────────────────────────────────
  const [agentStates,   setAgentStates]   = useState(INITIAL_AGENT_STATES);
  const [summaryState,  setSummaryState]  = useState({ status: 'idle', content: '' });
  const [history,       setHistory]       = useState([]);
  const [selectedId,    setSelectedId]    = useState(null);
  const [inputValue,    setInputValue]    = useState('');
  const [isRunning,     setIsRunning]     = useState(false);
  const [missionId,     setMissionId]     = useState(null);
  const [activeRequest, setActiveRequest] = useState('');
  const [totalTokens,   setTotalTokens]   = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [isSaved,       setIsSaved]       = useState(false);
  const [followUpContext, setFollowUpContext] = useState(null);
  const startTimeRef = useRef(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [selectedAgent,         setSelectedAgent]         = useState(null);
  const [isRerunning,           setIsRerunning]           = useState(false);
  const [showSettings,          setShowSettings]          = useState(false);
  const [showClaudeCode,        setShowClaudeCode]        = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [isFocusMode,           setIsFocusMode]           = useState(false);
  const [focusAgent,            setFocusAgent]            = useState(null);
  const [tagFilter,             setTagFilter]             = useState(null);
  const [tagInput,              setTagInput]              = useState('');

  // ── Project plan state ────────────────────────────────────────────────────
  const [projectPlan,        setProjectPlan]        = useState(null);
  const [projectPlanLoading, setProjectPlanLoading] = useState(false);

  // ── Proposal state ────────────────────────────────────────────────────────
  const [showProposal,    setShowProposal]    = useState(false);
  const [proposalContent, setProposalContent] = useState('');
  const [proposalLoading, setProposalLoading] = useState(false);

  // ── Morning briefing state ────────────────────────────────────────────────
  const [isMorningBriefing, setIsMorningBriefing] = useState(false);
  const [morningContent,    setMorningContent]    = useState('');
  const [morningLoading,    setMorningLoading]    = useState(false);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const [timerSeconds, setTimerSeconds] = useState(0);
  useEffect(() => {
    if (!isRunning) { setTimerSeconds(0); return; }
    const t = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isRunning]);

  // ── Apply theme to body ───────────────────────────────────────────────────
  useEffect(() => {
    document.body.classList.toggle('light-mode', isLight);
  }, [isLight]);

  // ── Theme / font helpers ──────────────────────────────────────────────────
  const toggleTheme = useCallback(() => {
    setIsLight((prev) => { const next = !prev; lsSet(LS_LIGHT_KEY, next); return next; });
  }, []);

  const handleFontSize = useCallback((s) => {
    setFontSize(s); lsSet(LS_FONTSIZE_KEY, s);
  }, []);

  // ── Board reset ───────────────────────────────────────────────────────────
  const resetBoard = useCallback(() => {
    setAgentStates(INITIAL_AGENT_STATES);
    setSummaryState({ status: 'idle', content: '' });
    setTotalTokens(null);
    setActiveSession(null);
    setIsSaved(false);
    setProjectPlan(null);
    setProjectPlanLoading(false);
  }, []);

  // ── New Mission ───────────────────────────────────────────────────────────
  const handleNewMission = useCallback(() => {
    setInputValue('');
    setActiveRequest('');
    setMissionId(null);
    setSelectedAgent(null);
    setSelectedId(null);
    setFollowUpContext(null);
    setTagInput('');
    resetBoard();
  }, [resetBoard]);

  // ── Save to Library ───────────────────────────────────────────────────────
  const handleSaveToLibrary = useCallback(() => {
    if (!activeSession || isSaved) return;
    const entry = {
      ...activeSession,
      libId:   `LIB-${Date.now()}`,
      savedAt: new Date().toISOString(),
      title:   getMissionTitle(activeSession.request, activeSession.agentOutputs),
    };
    setLibrary((prev) => { const next = [entry, ...prev]; lsSet(LS_LIBRARY_KEY, next); return next; });
    setIsSaved(true);
  }, [activeSession, isSaved]);

  // ── Pin toggle ────────────────────────────────────────────────────────────
  const handlePinToggle = useCallback((id) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      lsSet(LS_PINNED_KEY, [...next]);
      return next;
    });
  }, []);

  // ── Tag management ────────────────────────────────────────────────────────
  const handleTagsUpdate = useCallback((id, tags) => {
    setMissionTags((prev) => {
      const next = { ...prev, [id]: tags };
      lsSet(LS_TAGS_KEY, next);
      return next;
    });
  }, []);

  const addTag = useCallback((raw) => {
    if (!activeSession) return;
    const tag = raw.trim().replace(/,/g, '');
    if (!tag) return;
    const current = missionTags[activeSession.id] ?? [];
    if (!current.includes(tag)) {
      handleTagsUpdate(activeSession.id, [...current, tag]);
    }
  }, [activeSession, missionTags, handleTagsUpdate]);

  const removeTag = useCallback((tag) => {
    if (!activeSession) return;
    handleTagsUpdate(activeSession.id, (missionTags[activeSession.id] ?? []).filter((t) => t !== tag));
  }, [activeSession, missionTags, handleTagsUpdate]);

  // ── Favorites ─────────────────────────────────────────────────────────────
  const handleFavorite = useCallback(({ agentKey, agentName, content, missionTitle }) => {
    const fav = {
      id:           `FAV-${Date.now()}`,
      agentKey,
      agentName,
      content,
      missionTitle,
      savedAt:      new Date().toISOString(),
    };
    setFavorites((prev) => { const next = [fav, ...prev]; lsSet(LS_FAVS_KEY, next); return next; });
  }, []);

  const handleDeleteFavorite = useCallback((favId) => {
    setFavorites((prev) => {
      const next = prev.filter((f, i) => (f.id ?? i) !== favId);
      lsSet(LS_FAVS_KEY, next);
      return next;
    });
  }, []);

  // ── Follow-up mode ────────────────────────────────────────────────────────
  const handleFollowUp = useCallback((item) => {
    const ctx = item.summary || Object.values(item.agentOutputs || {}).filter(Boolean).join('\n\n---\n\n');
    setFollowUpContext(ctx);
    setInputValue(`Following up on: ${(item.title || item.request).slice(0, 70)}`);
    document.querySelector('textarea')?.focus();
  }, []);

  // ── Save all settings ─────────────────────────────────────────────────────
  const saveAllSettings = useCallback(({ configs, agencyProfile: ap, emailSettings: es, notionSettings: ns }) => {
    setAgentConfigs(configs);          lsSet(LS_CONFIGS_KEY, configs);
    setAgencyProfile(ap);              lsSet(LS_AGENCY_KEY, ap);
    setEmailSettings(es);              lsSet(LS_EMAIL_KEY, es);
    setNotionSettings(ns);             lsSet(LS_NOTION_KEY, ns);
  }, []);

  // ── Animate agents from bulk JSON response ────────────────────────────────
  const populateAgentsAnimated = useCallback((agentOutputs) => {
    const SEQ   = ['director', 'architect', 'spark', 'stack', 'memo', 'sharp'];
    const DELAY = 350;
    setAgentStates((prev) => {
      const next = { ...prev };
      SEQ.forEach((k) => { next[k] = { status: 'thinking', content: '', tokens: null, timestamp: null }; });
      return next;
    });
    SEQ.forEach((key, i) => {
      setTimeout(() => {
        setAgentStates((prev) => ({
          ...prev,
          [key]: { status: 'done', content: agentOutputs[key] ?? '', tokens: null, timestamp: new Date().toISOString() },
        }));
      }, (i + 1) * DELAY);
    });
    return SEQ.length * DELAY;
  }, []);

  // ── Deploy all agents ─────────────────────────────────────────────────────
  const deployAgents = useCallback(async (requestOverride) => {
    const request = (typeof requestOverride === 'string' ? requestOverride : inputValue).trim();
    if (!request || isRunning) return;

    // Morning briefing intercept
    if (MORNING_RE.test(request)) {
      setIsRunning(true);
      setMorningLoading(true);
      setIsMorningBriefing(true);
      setMorningContent('');
      try {
        const resp = await fetch('/api/morning-briefing', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ agencyProfile }),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const { briefing } = await resp.json();
        setMorningContent(briefing);
      } catch (err) {
        setMorningContent(`Error loading morning briefing: ${err.message}`);
      } finally {
        setMorningLoading(false);
        setIsRunning(false);
      }
      return;
    }

    startTimeRef.current = Date.now();
    setIsRunning(true);
    setActiveRequest(request);
    setInputValue(request);
    setSelectedId(null);
    setSelectedAgent(null);
    setIsSaved(false);
    setProjectPlan(null);
    resetBoard();

    setAgentStates(() => {
      const s = {};
      ['director','architect','spark','stack','memo','sharp'].forEach(
        (k) => { s[k] = { status: 'thinking', content: '', tokens: null, timestamp: null }; }
      );
      return s;
    });

    const ctx = followUpContext;
    setFollowUpContext(null);

    try {
      const response = await fetch('/api/agents/run', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ request, customAgents: agentConfigs, agencyProfile, followUpContext: ctx }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      const { missionId: mid, agentOutputs, summary, totalTokens: tok } = data;

      setMissionId(mid);
      setTotalTokens(tok);
      setSummaryState({ status: 'thinking', content: '' });

      const totalDelay = populateAgentsAnimated(agentOutputs);

      setTimeout(() => {
        setSummaryState({ status: 'done', content: summary });
        const session = {
          id:           Date.now().toString(),
          missionId:    mid,
          request,
          title:        getMissionTitle(request, agentOutputs),
          timestamp:    new Date().toISOString(),
          startTime:    startTimeRef.current,
          endTime:      Date.now(),
          agentOutputs,
          summary,
          totalTokens:  tok,
        };
        setActiveSession(session);
        setHistory((prev) => [session, ...prev]);
        setSelectedId(session.id);
      }, totalDelay + 400);

    } catch (err) {
      console.error('[deployAgents]', err);
      setAgentStates(INITIAL_AGENT_STATES);
      setSummaryState({ status: 'error', content: err.message });
    } finally {
      setIsRunning(false);
    }
  }, [inputValue, isRunning, resetBoard, agentConfigs, agencyProfile, followUpContext, populateAgentsAnimated]);

  // ── Re-run single agent ───────────────────────────────────────────────────
  const rerunAgent = useCallback(async (agentKey) => {
    if (isRerunning || !activeRequest) return;
    setIsRerunning(true);
    setAgentStates((prev) => ({
      ...prev,
      [agentKey]: { ...prev[agentKey], status: 'thinking', content: '' },
    }));
    const previousOutputs = {};
    Object.entries(agentStates).forEach(([k, v]) => { if (v.content) previousOutputs[k] = v.content; });
    try {
      const response = await fetch('/api/agents/single', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ agentKey, request: activeRequest, previousOutputs, customAgents: agentConfigs, agencyProfile }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }
      const { content, tokens } = await response.json();
      setAgentStates((prev) => ({
        ...prev,
        [agentKey]: { status: 'done', content, tokens, timestamp: new Date().toISOString() },
      }));
      setActiveSession((prev) => prev
        ? { ...prev, agentOutputs: { ...prev.agentOutputs, [agentKey]: content } }
        : prev);
    } catch (err) {
      console.error('[rerunAgent]', err);
      setAgentStates((prev) => ({
        ...prev,
        [agentKey]: { status: 'error', content: err.message, tokens: null, timestamp: null },
      }));
    } finally {
      setIsRerunning(false);
    }
  }, [isRerunning, activeRequest, agentStates, agentConfigs, agencyProfile]);

  // ── Ask follow-up (Director only) ─────────────────────────────────────────
  const handleAskFollowUp = useCallback(async (text) => {
    if (!text.trim()) return;
    const previousOutputs = {};
    Object.entries(agentStates).forEach(([k, v]) => { if (v.content) previousOutputs[k] = v.content; });
    try {
      const response = await fetch('/api/agents/single', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ agentKey: 'director', request: text, previousOutputs, customAgents: agentConfigs, agencyProfile }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const { content } = await response.json();
      setSummaryState((prev) => ({
        status:  'done',
        content: (prev.content ? prev.content + '\n\n---\n\n**Follow-up:** ' + text + '\n\n' : '') + content,
      }));
    } catch (err) {
      console.error('[handleAskFollowUp]', err);
    }
  }, [agentStates, agentConfigs, agencyProfile]);

  // ── Generate project plan ─────────────────────────────────────────────────
  const generateProjectPlan = useCallback(async () => {
    if (!activeSession || projectPlanLoading) return;
    setProjectPlanLoading(true);
    setProjectPlan(null);
    try {
      const resp = await fetch('/api/agents/project-plan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ request: activeSession.request, agentOutputs: activeSession.agentOutputs }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const plan = await resp.json();
      setProjectPlan(plan);
    } catch (err) {
      console.error('[generateProjectPlan]', err);
    } finally {
      setProjectPlanLoading(false);
    }
  }, [activeSession, projectPlanLoading]);

  // ── Generate proposal ─────────────────────────────────────────────────────
  const handleGenerateProposal = useCallback(async () => {
    if (!activeSession || proposalLoading) return;
    setProposalLoading(true);
    setProposalContent('');
    setShowProposal(true);
    try {
      const resp = await fetch('/api/agents/proposal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ request: activeSession.request, agentOutputs: activeSession.agentOutputs }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const { proposal } = await resp.json();
      setProposalContent(proposal);
    } catch (err) {
      console.error('[handleGenerateProposal]', err);
      setProposalContent(`Error generating proposal: ${err.message}`);
    } finally {
      setProposalLoading(false);
    }
  }, [activeSession, proposalLoading]);

  // ── Email summary ─────────────────────────────────────────────────────────
  const handleEmailSummary = useCallback(() => {
    if (!activeSession) return;
    const subject = encodeURIComponent(`JARVIS Mission: ${activeSession.title || activeSession.request.slice(0, 60)}`);
    const body    = encodeURIComponent(summaryState.content || activeSession.summary || '');
    const to      = emailSettings?.recipientEmail || '';
    window.open(`mailto:${to}?subject=${subject}&body=${body}`);
  }, [activeSession, emailSettings, summaryState]);

  // ── Notion export ─────────────────────────────────────────────────────────
  const handleNotionExport = useCallback(async () => {
    if (!activeSession) return;
    if (!notionSettings?.apiKey || !notionSettings?.databaseId) {
      alert('Configure Notion API key and Database ID in Settings → Integrations');
      return;
    }
    try {
      const resp = await fetch('/api/notion/export', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          notionApiKey: notionSettings.apiKey,
          notionDbId:   notionSettings.databaseId,
          title:        activeSession.title || activeSession.request.slice(0, 60),
          content:      summaryState.content || activeSession.summary || '',
          request:      activeSession.request,
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const { url } = await resp.json();
      if (url) window.open(url, '_blank');
    } catch (err) {
      console.error('[handleNotionExport]', err);
      alert('Notion export failed. Check Settings → Integrations.');
    }
  }, [activeSession, notionSettings, summaryState]);

  // ── Load history item ─────────────────────────────────────────────────────
  const loadHistoryItem = useCallback((item) => {
    setSelectedId(item.id);
    setInputValue(item.request);
    setActiveRequest(item.request);
    setMissionId(item.missionId ?? null);
    setTotalTokens(item.totalTokens ?? null);
    setSelectedAgent(null);
    setActiveSession(item);
    setIsSaved(false);
    setProjectPlan(null);
    setProjectPlanLoading(false);
    setTagInput('');
    const o = item.agentOutputs ?? {};
    setAgentStates({
      director:  { status: o.director  ? 'done' : 'idle', content: o.director  ?? '', tokens: null, timestamp: null },
      architect: { status: o.architect ? 'done' : 'idle', content: o.architect ?? '', tokens: null, timestamp: null },
      spark:     { status: o.spark     ? 'done' : 'idle', content: o.spark     ?? '', tokens: null, timestamp: null },
      stack:     { status: o.stack     ? 'done' : 'idle', content: o.stack     ?? '', tokens: null, timestamp: null },
      memo:      { status: o.memo      ? 'done' : 'idle', content: o.memo      ?? '', tokens: null, timestamp: null },
      sharp:     { status: o.sharp     ? 'done' : 'idle', content: o.sharp     ?? '', tokens: null, timestamp: null },
    });
    setSummaryState({ status: item.summary ? 'done' : 'idle', content: item.summary ?? '' });
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 'Enter') {
        e.preventDefault(); deployAgents();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (selectedAgent) { setFocusAgent(selectedAgent); setIsFocusMode(true); }
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        document.querySelector('[data-export-btn]')?.click();
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault(); handleNewMission();
      } else if (e.key === '/') {
        e.preventDefault(); setShowKeyboardShortcuts(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deployAgents, selectedAgent, handleNewMission]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (!isFocusMode && !showClaudeCode && !showKeyboardShortcuts && !showSettings && !showProposal && !isMorningBriefing) {
          setSelectedAgent(null);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFocusMode, showClaudeCode, showKeyboardShortcuts, showSettings, showProposal, isMorningBriefing]);

  // ── Derived values ────────────────────────────────────────────────────────
  const showSummary     = summaryState.status !== 'idle';
  const directorContent = agentStates.director?.content ?? activeSession?.summary ?? '';
  const focusContent    = focusAgent ? (agentStates[focusAgent]?.content ?? '') : '';
  const sessionForStats = activeSession ? { ...activeSession, endTime: activeSession.endTime ?? Date.now() } : null;
  const activeTags      = activeSession ? (missionTags[activeSession.id] ?? []) : [];

  const mainBg      = isLight ? '#f5f2eb' : '#040c04';
  const bdr         = isLight ? '#d4c8a0' : '#1a3020';
  const statusColor = isLight ? '#7a7060' : '#3a5a3a';
  const dim         = isLight ? '#9a9070' : '#3a5a3a';
  const textMain    = isLight ? '#2a2518' : '#b8d8b8';

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: mainBg }}>
      <Header
        missionId={missionId}
        isRunning={isRunning}
        isLight={isLight}
        onToggleTheme={toggleTheme}
        fontSize={fontSize}
        onFontSize={handleFontSize}
        timerSeconds={timerSeconds}
        onFocusMode={() => {
          if (selectedAgent) { setFocusAgent(selectedAgent); setIsFocusMode(true); }
        }}
        onKeyboardShortcuts={() => setShowKeyboardShortcuts(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <ConversationSidebar
          history={history}
          onSelectItem={loadHistoryItem}
          selectedId={selectedId}
          onSettingsClick={() => setShowSettings(true)}
          isRunning={isRunning}
          agentStates={agentStates}
          activeMissionId={missionId}
          library={library}
          onLibrarySelect={loadHistoryItem}
          isLight={isLight}
          pinnedIds={pinnedIds}
          onPinToggle={handlePinToggle}
          missionTags={missionTags}
          tagFilter={tagFilter}
          onTagFilter={setTagFilter}
          onFollowUp={handleFollowUp}
          favorites={favorites}
          onDeleteFavorite={handleDeleteFavorite}
        />

        <main className="flex-1 overflow-y-auto relative">
          <div className="max-w-5xl mx-auto px-6 py-6">

            {/* Mission status bar */}
            <div className="flex items-center justify-between mb-4">
              <div>
                {activeRequest ? (
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: statusColor }}>
                      {followUpContext ? 'Follow-up Context Loaded' : 'Active Mission'}
                    </p>
                    <p className="text-sm font-mono max-w-xl leading-snug" style={{ color: isLight ? '#5a5030' : '#7a9a7a' }}>
                      "{activeRequest.length > 90 ? activeRequest.slice(0, 90) + '…' : activeRequest}"
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: statusColor }}>
                      System Status
                    </p>
                    <p className="text-sm font-mono mt-0.5" style={{ color: isLight ? '#9a9070' : '#3a5a3a' }}>
                      Board standing by. Enter mission parameters above.
                    </p>
                  </div>
                )}
              </div>
              {isRunning && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded"
                  style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#C9A84C' }} />
                  <span className="text-[11px] font-mono font-semibold" style={{ color: '#C9A84C' }}>
                    Agents Deployed
                  </span>
                </div>
              )}
            </div>

            {/* Follow-up context banner */}
            {followUpContext && (
              <div
                className="mb-4 flex items-center justify-between px-4 py-2.5 rounded-lg"
                style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)' }}
              >
                <p className="text-[10px] font-mono" style={{ color: '#60a5fa' }}>
                  Follow-up mode — previous session context will be passed to Director
                </p>
                <button
                  onClick={() => setFollowUpContext(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa60', padding: 2 }}
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </div>
            )}

            {/* Mission templates */}
            <MissionTemplates
              onSelect={(text) => setInputValue(text)}
              isLight={isLight}
            />

            {/* Input */}
            <InputPanel
              value={inputValue}
              onChange={setInputValue}
              onDeploy={deployAgents}
              isRunning={isRunning}
              missionId={missionId}
              lastTokens={!isRunning ? totalTokens : null}
            />

            {/* Round table */}
            <BoardroomTable
              agentStates={agentStates}
              selectedAgent={selectedAgent}
              onAgentClick={(key) => setSelectedAgent((prev) => (prev === key ? null : key))}
              agentConfigs={agentConfigs}
            />

            {/* Session stats */}
            {sessionForStats && <SessionStats session={sessionForStats} isLight={isLight} />}

            {/* Quick actions */}
            {activeSession && (
              <QuickActionsBar
                isLight={isLight}
                onNewMission={handleNewMission}
                onRerunAll={() => deployAgents(activeRequest)}
                onSaveToLibrary={handleSaveToLibrary}
                isRunning={isRunning}
                isSaved={isSaved}
                request={activeRequest}
                onAskFollowUp={handleAskFollowUp}
                onEmailSummary={handleEmailSummary}
                onNotionExport={handleNotionExport}
                onGenerateProposal={handleGenerateProposal}
                onGeneratePlan={generateProjectPlan}
              />
            )}

            {/* Tag input (shown after session completes) */}
            {activeSession && !isRunning && (
              <div
                className="mb-6 flex items-center gap-2 px-4 py-2.5 rounded-lg flex-wrap"
                style={{ background: isLight ? '#f5f0e8' : '#060e06', border: `1px solid ${bdr}` }}
              >
                <Tag className="w-3 h-3 flex-shrink-0" style={{ color: dim }} />
                <span className="text-[9px] font-mono uppercase tracking-widest flex-shrink-0" style={{ color: dim }}>
                  Tags:
                </span>
                {activeTags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded"
                    style={{ color: tagColor(tag), background: `${tagColor(tag)}18`, border: `1px solid ${tagColor(tag)}40` }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                      e.preventDefault();
                      addTag(tagInput);
                      setTagInput('');
                    }
                  }}
                  placeholder="Add tag, press Enter…"
                  className="bg-transparent outline-none font-mono flex-1"
                  style={{ fontSize: 10, color: textMain, minWidth: 120 }}
                />
              </div>
            )}

            {/* Board summary */}
            {showSummary && (
              <BoardSummary
                summaryState={summaryState}
                session={activeSession}
                isLight={isLight}
                fontSize={fontSize}
                onShowClaudeCode={() => setShowClaudeCode(true)}
              />
            )}

            {/* Project plan */}
            {(projectPlanLoading || projectPlan) && (
              <ProjectPlan
                plan={projectPlan}
                sessionId={activeSession?.id}
                isLight={isLight}
                isLoading={projectPlanLoading}
              />
            )}
          </div>
        </main>

        {/* Agent panel drawer */}
        {selectedAgent && (
          <AgentPanel
            agentKey={selectedAgent}
            agentState={agentStates[selectedAgent]}
            agentConfigs={agentConfigs}
            request={activeRequest}
            onClose={() => setSelectedAgent(null)}
            onRerun={rerunAgent}
            isRerunning={isRerunning}
            isLight={isLight}
            fontSize={fontSize}
            onFocusMode={(key) => { setFocusAgent(key); setIsFocusMode(true); }}
            onShowClaudeCode={() => setShowClaudeCode(true)}
            onFavorite={handleFavorite}
            missionTitle={activeSession?.title || ''}
          />
        )}
      </div>

      {/* ── Modals & overlays ── */}
      {showSettings && (
        <Settings
          configs={agentConfigs}
          agencyProfile={agencyProfile}
          emailSettings={emailSettings}
          notionSettings={notionSettings}
          onSave={(all) => { saveAllSettings(all); setShowSettings(false); }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showClaudeCode && (
        <ClaudeCodeModal
          directorContent={directorContent}
          isLight={isLight}
          onClose={() => setShowClaudeCode(false)}
        />
      )}

      {showKeyboardShortcuts && (
        <KeyboardShortcuts
          isLight={isLight}
          onClose={() => setShowKeyboardShortcuts(false)}
        />
      )}

      {isFocusMode && focusAgent && (
        <FocusMode
          agentKey={focusAgent}
          content={focusContent}
          fontSize={fontSize}
          isLight={isLight}
          onClose={() => { setIsFocusMode(false); setFocusAgent(null); }}
        />
      )}

      {showProposal && (
        <ProposalModal
          content={proposalContent}
          isLoading={proposalLoading}
          isLight={isLight}
          fontSize={fontSize}
          onClose={() => { setShowProposal(false); setProposalContent(''); }}
        />
      )}

      {isMorningBriefing && (
        <MorningBriefing
          content={morningContent}
          isLoading={morningLoading}
          fontSize={fontSize}
          onClose={() => { setIsMorningBriefing(false); setMorningContent(''); }}
        />
      )}
    </div>
  );
}
