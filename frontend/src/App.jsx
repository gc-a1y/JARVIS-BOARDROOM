import React, { useState, useCallback } from 'react';
import ConversationSidebar from './components/ConversationSidebar';
import InputPanel from './components/InputPanel';
import AgentGrid from './components/AgentGrid';
import BoardSummary from './components/BoardSummary';

const INITIAL_AGENT_STATES = {
  director:  { status: 'idle', content: '' },
  architect: { status: 'idle', content: '' },
  spark:     { status: 'idle', content: '' },
  stack:     { status: 'idle', content: '' },
  memo:      { status: 'idle', content: '' },
  sharp:     { status: 'idle', content: '' },
};

export default function App() {
  const [agentStates, setAgentStates]   = useState(INITIAL_AGENT_STATES);
  const [summaryState, setSummaryState] = useState({ status: 'idle', content: '' });
  const [history, setHistory]           = useState([]);
  const [selectedId, setSelectedId]     = useState(null);
  const [inputValue, setInputValue]     = useState('');
  const [isRunning, setIsRunning]       = useState(false);
  const [activeRequest, setActiveRequest] = useState('');

  const resetBoard = useCallback(() => {
    setAgentStates(INITIAL_AGENT_STATES);
    setSummaryState({ status: 'idle', content: '' });
  }, []);

  const deployAgents = useCallback(async () => {
    if (!inputValue.trim() || isRunning) return;

    const request = inputValue.trim();
    setIsRunning(true);
    setActiveRequest(request);
    setSelectedId(null);
    resetBoard();

    const session = {
      id: Date.now().toString(),
      request,
      timestamp: new Date().toISOString(),
      agentOutputs: {},
      summary: '',
    };

    try {
      const response = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errBody.error || `HTTP ${response.status}`);
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          let data;
          try { data = JSON.parse(line.slice(6)); }
          catch { continue; }

          switch (data.type) {
            case 'agent_start':
              setAgentStates((prev) => ({
                ...prev,
                [data.agent]: { status: 'thinking', content: '' },
              }));
              break;

            case 'agent_chunk':
              setAgentStates((prev) => ({
                ...prev,
                [data.agent]: {
                  ...prev[data.agent],
                  content: (prev[data.agent]?.content ?? '') + data.chunk,
                },
              }));
              break;

            case 'agent_done':
              setAgentStates((prev) => ({
                ...prev,
                [data.agent]: { status: 'done', content: data.content },
              }));
              session.agentOutputs[data.agent] = data.content;
              break;

            case 'summary_start':
              setSummaryState({ status: 'thinking', content: '' });
              break;

            case 'summary_chunk':
              setSummaryState((prev) => ({
                ...prev,
                status: 'thinking',
                content: prev.content + data.chunk,
              }));
              break;

            case 'complete':
              setSummaryState({ status: 'done', content: data.summary });
              session.summary = data.summary;
              setHistory((prev) => [session, ...prev]);
              setSelectedId(session.id);
              break;

            case 'error':
              throw new Error(data.message);
          }
        }
      }
    } catch (err) {
      console.error('[deployAgents]', err);
      setSummaryState({ status: 'error', content: err.message });
    } finally {
      setIsRunning(false);
    }
  }, [inputValue, isRunning, resetBoard]);

  const loadHistoryItem = useCallback((item) => {
    setSelectedId(item.id);
    setInputValue(item.request);
    setActiveRequest(item.request);

    const o = item.agentOutputs ?? {};
    setAgentStates({
      director:  { status: o.director  ? 'done' : 'idle', content: o.director  ?? '' },
      architect: { status: o.architect ? 'done' : 'idle', content: o.architect ?? '' },
      spark:     { status: o.spark     ? 'done' : 'idle', content: o.spark     ?? '' },
      stack:     { status: o.stack     ? 'done' : 'idle', content: o.stack     ?? '' },
      memo:      { status: o.memo      ? 'done' : 'idle', content: o.memo      ?? '' },
      sharp:     { status: o.sharp     ? 'done' : 'idle', content: o.sharp     ?? '' },
    });
    setSummaryState({
      status:  item.summary ? 'done' : 'idle',
      content: item.summary ?? '',
    });
  }, []);

  const showSummary = summaryState.status !== 'idle';

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Sidebar */}
      <ConversationSidebar
        history={history}
        onSelectItem={loadHistoryItem}
        selectedId={selectedId}
      />

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-7">

          {/* Top bar */}
          <div className="flex items-start justify-between mb-8">
            <div>
              {activeRequest ? (
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">
                    Active mission
                  </p>
                  <p className="text-sm text-gray-300 max-w-lg leading-snug">
                    "{activeRequest.length > 100 ? activeRequest.slice(0, 100) + '…' : activeRequest}"
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">
                    Status
                  </p>
                  <p className="text-sm text-gray-600">Board standing by</p>
                </div>
              )}
            </div>

            {/* Live status pill */}
            {isRunning && (
              <div className="flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
                <span className="text-[11px] text-[#C9A84C] font-medium">Agents active</span>
              </div>
            )}
          </div>

          {/* Input */}
          <InputPanel
            value={inputValue}
            onChange={setInputValue}
            onDeploy={deployAgents}
            isRunning={isRunning}
          />

          {/* Agent cards */}
          <AgentGrid agentStates={agentStates} />

          {/* Board summary */}
          {showSummary && <BoardSummary summaryState={summaryState} />}
        </div>
      </main>
    </div>
  );
}
