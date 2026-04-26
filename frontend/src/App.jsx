import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header.jsx';
import ConversationSidebar from './components/ConversationSidebar.jsx';
import InputPanel from './components/InputPanel.jsx';
import BoardroomTable from './components/BoardroomTable.jsx';
import AgentPanel from './components/AgentPanel.jsx';
import BoardSummary from './components/BoardSummary.jsx';
import Settings, { DEFAULT_AGENT_CONFIGS } from './components/Settings.jsx';

const LS_CONFIGS_KEY = 'jarvis-agent-configs';

const INITIAL_AGENT_STATES = {
  director:  { status: 'idle', content: '', tokens: null, timestamp: null },
  architect: { status: 'idle', content: '', tokens: null, timestamp: null },
  spark:     { status: 'idle', content: '', tokens: null, timestamp: null },
  stack:     { status: 'idle', content: '', tokens: null, timestamp: null },
  memo:      { status: 'idle', content: '', tokens: null, timestamp: null },
  sharp:     { status: 'idle', content: '', tokens: null, timestamp: null },
};

function loadConfigs() {
  try {
    const raw = localStorage.getItem(LS_CONFIGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults so new fields are always present
      const merged = {};
      for (const key of Object.keys(DEFAULT_AGENT_CONFIGS)) {
        merged[key] = { ...DEFAULT_AGENT_CONFIGS[key], ...(parsed[key] ?? {}) };
      }
      return merged;
    }
  } catch { /* fall through */ }
  return JSON.parse(JSON.stringify(DEFAULT_AGENT_CONFIGS));
}

export default function App() {
  // ── Core state ──────────────────────────────────────────────────────────────
  const [agentStates,   setAgentStates]   = useState(INITIAL_AGENT_STATES);
  const [summaryState,  setSummaryState]  = useState({ status: 'idle', content: '' });
  const [history,       setHistory]       = useState([]);
  const [selectedId,    setSelectedId]    = useState(null);
  const [inputValue,    setInputValue]    = useState('');
  const [isRunning,     setIsRunning]     = useState(false);
  const [missionId,     setMissionId]     = useState(null);
  const [activeRequest, setActiveRequest] = useState('');
  const [totalTokens,   setTotalTokens]   = useState(null);
  const [activeSession, setActiveSession] = useState(null); // full session object once complete

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [selectedAgent,  setSelectedAgent]  = useState(null);
  const [isRerunning,    setIsRerunning]     = useState(false);
  const [showSettings,   setShowSettings]   = useState(false);
  const [agentConfigs,   setAgentConfigs]   = useState(loadConfigs);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const resetBoard = useCallback(() => {
    setAgentStates(INITIAL_AGENT_STATES);
    setSummaryState({ status: 'idle', content: '' });
    setTotalTokens(null);
    setActiveSession(null);
  }, []);

  // Animate agent completion one-by-one after bulk JSON response
  const populateAgentsAnimated = useCallback((agentOutputs) => {
    const SEQUENCE = ['director', 'architect', 'spark', 'stack', 'memo', 'sharp'];
    const DELAY    = 350; // ms between each agent reveal

    // First set all to "thinking"
    setAgentStates((prev) => {
      const next = { ...prev };
      SEQUENCE.forEach((k) => {
        next[k] = { status: 'thinking', content: '', tokens: null, timestamp: null };
      });
      return next;
    });

    // Then reveal each agent with a delay
    SEQUENCE.forEach((key, i) => {
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

    return SEQUENCE.length * DELAY;
  }, []);

  // ── Deploy all agents ─────────────────────────────────────────────────────────
  const deployAgents = useCallback(async () => {
    if (!inputValue.trim() || isRunning) return;

    const request = inputValue.trim();
    setIsRunning(true);
    setActiveRequest(request);
    setSelectedId(null);
    setSelectedAgent(null);
    resetBoard();

    // Set all agents to thinking immediately for visual feedback
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

      // Set summary to thinking while we animate agents
      setSummaryState({ status: 'thinking', content: '' });

      // Animate agents appearing sequentially
      const totalDelay = populateAgentsAnimated(agentOutputs);

      // Show summary after agents
      setTimeout(() => {
        setSummaryState({ status: 'done', content: summary });

        const session = {
          id:           Date.now().toString(),
          missionId:    mid,
          request,
          timestamp:    new Date().toISOString(),
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
  }, [inputValue, isRunning, resetBoard, agentConfigs, populateAgentsAnimated]);

  // ── Re-run single agent ───────────────────────────────────────────────────────
  const rerunAgent = useCallback(async (agentKey) => {
    if (isRerunning || !activeRequest) return;

    setIsRerunning(true);
    setAgentStates((prev) => ({
      ...prev,
      [agentKey]: { ...prev[agentKey], status: 'thinking', content: '' },
    }));

    // Build previousOutputs from current state
    const previousOutputs = {};
    Object.entries(agentStates).forEach(([k, v]) => {
      if (v.content) previousOutputs[k] = v.content;
    });

    try {
      const response = await fetch('/api/agents/single', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          agentKey,
          request:        activeRequest,
          previousOutputs,
          customAgents:   agentConfigs,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const { content, tokens } = await response.json();

      setAgentStates((prev) => ({
        ...prev,
        [agentKey]: {
          status:    'done',
          content,
          tokens,
          timestamp: new Date().toISOString(),
        },
      }));

      // Update activeSession with new content
      setActiveSession((prev) => prev ? {
        ...prev,
        agentOutputs: { ...prev.agentOutputs, [agentKey]: content },
      } : prev);

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

  // ── Load history item ─────────────────────────────────────────────────────────
  const loadHistoryItem = useCallback((item) => {
    setSelectedId(item.id);
    setInputValue(item.request);
    setActiveRequest(item.request);
    setMissionId(item.missionId ?? null);
    setTotalTokens(item.totalTokens ?? null);
    setSelectedAgent(null);
    setActiveSession(item);

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

  // ── Save settings ─────────────────────────────────────────────────────────────
  const saveSettings = useCallback((newConfigs) => {
    setAgentConfigs(newConfigs);
    try { localStorage.setItem(LS_CONFIGS_KEY, JSON.stringify(newConfigs)); }
    catch { /* storage unavailable */ }
  }, []);

  // ── Close panel when clicking outside ────────────────────────────────────────
  const handleMainClick = useCallback((e) => {
    // Close the agent panel if clicking the main overlay background
    if (e.target === e.currentTarget) setSelectedAgent(null);
  }, []);

  const showSummary   = summaryState.status !== 'idle';
  const activeMsnId   = isRunning ? null : missionId; // show in sidebar only when not running

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#040c04' }}>
      {/* Classified header bar */}
      <Header missionId={missionId} isRunning={isRunning} />

      {/* Body: sidebar + main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <ConversationSidebar
          history={history}
          onSelectItem={loadHistoryItem}
          selectedId={selectedId}
          onSettingsClick={() => setShowSettings(true)}
          isRunning={isRunning}
          agentStates={agentStates}
          activeMissionId={missionId}
        />

        {/* Main content */}
        <main
          className="flex-1 overflow-y-auto relative"
          onClick={selectedAgent ? handleMainClick : undefined}
        >
          <div className="max-w-5xl mx-auto px-6 py-6">
            {/* Mission status bar */}
            <div className="flex items-center justify-between mb-5">
              <div>
                {activeRequest ? (
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: '#3a5a3a' }}>
                      Active Mission
                    </p>
                    <p className="text-sm font-mono max-w-xl leading-snug" style={{ color: '#7a9a7a' }}>
                      "{activeRequest.length > 90 ? activeRequest.slice(0, 90) + '…' : activeRequest}"
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#2a4a2a' }}>
                      System Status
                    </p>
                    <p className="text-sm font-mono mt-0.5" style={{ color: '#3a5a3a' }}>
                      Board standing by. Enter mission parameters above.
                    </p>
                  </div>
                )}
              </div>

              {isRunning && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded"
                  style={{
                    background: 'rgba(201,168,76,0.08)',
                    border:     '1px solid rgba(201,168,76,0.25)',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: '#C9A84C' }}
                  />
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

            {/* Board summary */}
            {showSummary && (
              <BoardSummary
                summaryState={summaryState}
                session={activeSession}
              />
            )}
          </div>
        </main>

        {/* Agent response panel (fixed right drawer) */}
        {selectedAgent && (
          <AgentPanel
            agentKey={selectedAgent}
            agentState={agentStates[selectedAgent]}
            agentConfigs={agentConfigs}
            request={activeRequest}
            allOutputs={agentStates}
            onClose={() => setSelectedAgent(null)}
            onRerun={rerunAgent}
            isRerunning={isRerunning}
          />
        )}
      </div>

      {/* Settings modal */}
      {showSettings && (
        <Settings
          configs={agentConfigs}
          onSave={(c) => { saveSettings(c); setShowSettings(false); }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
