import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header.jsx';
import ConversationSidebar from './components/ConversationSidebar.jsx';
import InputPanel from './components/InputPanel.jsx';
import BoardroomTable from './components/BoardroomTable.jsx';
import AgentPanel from './components/AgentPanel.jsx';
import BoardSummary from './components/BoardSummary.jsx';
import Settings, { DEFAULT_AGENT_CONFIGS } from './components/Settings.jsx';
import ClaudeCodeModal from './components/ClaudeCodeModal.jsx';
import FocusMode from './components/FocusMode.jsx';
import KeyboardShortcuts from './components/KeyboardShortcuts.jsx';
import QuickActionsBar from './components/QuickActionsBar.jsx';
import SessionStats from './components/SessionStats.jsx';

const LS_CONFIGS_KEY  = 'jarvis-agent-configs';
const LS_LIBRARY_KEY  = 'jarvis-library';
const LS_LIGHT_KEY    = 'jarvis-light-mode';
const LS_FONTSIZE_KEY = 'jarvis-font-size';

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

export default function App() {
  // ── Persistence / theme ───────────────────────────────────────────────────
  const [isLight,   setIsLight]   = useState(() => lsGet(LS_LIGHT_KEY, false));
  const [fontSize,  setFontSize]  = useState(() => lsGet(LS_FONTSIZE_KEY, 'md'));
  const [agentConfigs, setAgentConfigs] = useState(loadConfigs);
  const [library,   setLibrary]   = useState(() => lsGet(LS_LIBRARY_KEY, []));

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
  const startTimeRef = useRef(null); // track session start time without re-renders

  // ── UI state ──────────────────────────────────────────────────────────────
  const [selectedAgent,        setSelectedAgent]        = useState(null);
  const [isRerunning,          setIsRerunning]          = useState(false);
  const [showSettings,         setShowSettings]         = useState(false);
  const [showClaudeCode,       setShowClaudeCode]       = useState(false);
  const [showKeyboardShortcuts,setShowKeyboardShortcuts]= useState(false);
  const [isFocusMode,          setIsFocusMode]          = useState(false);
  const [focusAgent,           setFocusAgent]           = useState(null);

  // ── Apply theme to body ───────────────────────────────────────────────────
  useEffect(() => {
    document.body.classList.toggle('light-mode', isLight);
  }, [isLight]);

  // ── Theme / font helpers ──────────────────────────────────────────────────
  const toggleTheme = useCallback(() => {
    setIsLight((prev) => {
      const next = !prev;
      lsSet(LS_LIGHT_KEY, next);
      return next;
    });
  }, []);

  const handleFontSize = useCallback((s) => {
    setFontSize(s);
    lsSet(LS_FONTSIZE_KEY, s);
  }, []);

  // ── Board reset ───────────────────────────────────────────────────────────
  const resetBoard = useCallback(() => {
    setAgentStates(INITIAL_AGENT_STATES);
    setSummaryState({ status: 'idle', content: '' });
    setTotalTokens(null);
    setActiveSession(null);
    setIsSaved(false);
  }, []);

  // ── New Mission ───────────────────────────────────────────────────────────
  const handleNewMission = useCallback(() => {
    setInputValue('');
    setActiveRequest('');
    setMissionId(null);
    setSelectedAgent(null);
    setSelectedId(null);
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
    setLibrary((prev) => {
      const next = [entry, ...prev];
      lsSet(LS_LIBRARY_KEY, next);
      return next;
    });
    setIsSaved(true);
  }, [activeSession, isSaved]);

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
          [key]: {
            status:    'done',
            content:   agentOutputs[key] ?? '',
            tokens:    null,
            timestamp: new Date().toISOString(),
          },
        }));
      }, (i + 1) * DELAY);
    });

    return SEQ.length * DELAY;
  }, []);

  // ── Deploy all agents ─────────────────────────────────────────────────────
  const deployAgents = useCallback(async (requestOverride) => {
    const request = (typeof requestOverride === 'string' ? requestOverride : inputValue).trim();
    if (!request || isRunning) return;

    startTimeRef.current = Date.now();
    setIsRunning(true);
    setActiveRequest(request);
    setInputValue(request);
    setSelectedId(null);
    setSelectedAgent(null);
    setIsSaved(false);
    resetBoard();

    setAgentStates(() => {
      const s = {};
      ['director','architect','spark','stack','memo','sharp'].forEach(
        (k) => { s[k] = { status: 'thinking', content: '', tokens: null, timestamp: null }; }
      );
      return s;
    });

    try {
      const response = await fetch('/api/agents/run', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ request, customAgents: agentConfigs }),
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
          id:          Date.now().toString(),
          missionId:   mid,
          request,
          title:       getMissionTitle(request, agentOutputs),
          timestamp:   new Date().toISOString(),
          startTime:   startTimeRef.current,
          endTime:     Date.now(),
          agentOutputs,
          summary,
          totalTokens: tok,
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
  }, [inputValue, isRunning, resetBoard, agentConfigs, populateAgentsAnimated]);

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
        body:    JSON.stringify({ agentKey, request: activeRequest, previousOutputs, customAgents: agentConfigs }),
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
  }, [isRerunning, activeRequest, agentStates, agentConfigs]);

  // ── Ask follow-up (Director only) ─────────────────────────────────────────
  const handleAskFollowUp = useCallback(async (text) => {
    if (!text.trim()) return;

    const previousOutputs = {};
    Object.entries(agentStates).forEach(([k, v]) => { if (v.content) previousOutputs[k] = v.content; });

    try {
      const response = await fetch('/api/agents/single', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          agentKey:        'director',
          request:         text,
          previousOutputs,
          customAgents:    agentConfigs,
        }),
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
  }, [agentStates, agentConfigs]);

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

    const o = item.agentOutputs ?? {};
    setAgentStates({
      director:  { status: o.director  ? 'done' : 'idle', content: o.director  ?? '', tokens: null, timestamp: null },
      architect: { status: o.architect ? 'done' : 'idle', content: o.architect ?? '', tokens: null, timestamp: null },
      spark:     { status: o.spark     ? 'done' : 'idle', content: o.spark     ?? '', tokens: null, timestamp: null },
      stack:     { status: o.stack     ? 'done' : 'idle', content: o.stack     ?? '', tokens: null, timestamp: null },
      memo:      { status: o.memo      ? 'done' : 'idle', content: o.memo      ?? '', tokens: null, timestamp: null },
      sharp:     { status: o.sharp     ? 'done' : 'idle', content: o.sharp     ?? '', tokens: null, timestamp: null },
    });
    setSummaryState({
      status:  item.summary ? 'done' : 'idle',
      content: item.summary ?? '',
    });
  }, []);

  // ── Save settings ─────────────────────────────────────────────────────────
  const saveSettings = useCallback((newConfigs) => {
    setAgentConfigs(newConfigs);
    lsSet(LS_CONFIGS_KEY, newConfigs);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        deployAgents();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (selectedAgent) { setFocusAgent(selectedAgent); setIsFocusMode(true); }
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        // Trigger export via BoardSummary — handled there
        document.querySelector('[data-export-btn]')?.click();
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        handleNewMission();
      } else if (e.key === '/') {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deployAgents, selectedAgent, handleNewMission]);

  // Close focus/modals on Escape (handled inside their own components already,
  // but also close AgentPanel here as a fallback)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (!isFocusMode && !showClaudeCode && !showKeyboardShortcuts && !showSettings) {
          setSelectedAgent(null);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFocusMode, showClaudeCode, showKeyboardShortcuts, showSettings]);

  // ── Derived values ────────────────────────────────────────────────────────
  const showSummary       = summaryState.status !== 'idle';
  const directorContent   = agentStates.director?.content ?? activeSession?.summary ?? '';
  const focusContent      = focusAgent ? (agentStates[focusAgent]?.content ?? '') : '';

  const sessionForStats = activeSession
    ? { ...activeSession, endTime: activeSession.endTime ?? Date.now() }
    : null;

  // ── Theme colours (main area) ─────────────────────────────────────────────
  const mainBg   = isLight ? '#f5f2eb' : '#040c04';
  const statusColor = isLight ? '#7a7060' : '#3a5a3a';

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: mainBg }}>
      <Header
        missionId={missionId}
        isRunning={isRunning}
        isLight={isLight}
        onToggleTheme={toggleTheme}
        fontSize={fontSize}
        onFontSize={handleFontSize}
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
        />

        <main className="flex-1 overflow-y-auto relative">
          <div className="max-w-5xl mx-auto px-6 py-6">
            {/* Mission status bar */}
            <div className="flex items-center justify-between mb-5">
              <div>
                {activeRequest ? (
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: statusColor }}>
                      Active Mission
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
              />
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
          />
        )}
      </div>

      {/* ── Modals & overlays ── */}
      {showSettings && (
        <Settings
          configs={agentConfigs}
          onSave={(c) => { saveSettings(c); setShowSettings(false); }}
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
    </div>
  );
}
