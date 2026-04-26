import React from 'react';
import { Clock, FolderOpen, Settings } from 'lucide-react';
import { AGENT_META } from './BoardroomTable.jsx';

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso) {
  const d = new Date(iso), today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yest = new Date(today); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Mini status dots for mission history items
function MiniAgentDots({ agentOutputs }) {
  return (
    <div className="flex items-center gap-0.5 mt-1.5">
      {AGENT_META.map((m) => (
        <div
          key={m.key}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: agentOutputs?.[m.key] ? m.color : '#1a3020',
            opacity:     agentOutputs?.[m.key] ? 0.8 : 0.4,
          }}
          title={m.name}
        />
      ))}
    </div>
  );
}

export default function ConversationSidebar({
  history,
  onSelectItem,
  selectedId,
  onSettingsClick,
  isRunning,
  agentStates,
  activeMissionId,
}) {
  return (
    <aside
      className="flex flex-col flex-shrink-0 h-full overflow-hidden"
      style={{
        width:       '272px',
        background:  '#050d05',
        borderRight: '1px solid #1a3020',
      }}
    >
      {/* Section title */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #152015' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-3.5 h-3.5" style={{ color: '#527052' }} />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: '#527052' }}>
              Mission Log
            </span>
          </div>
          <button
            onClick={onSettingsClick}
            className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: '#3a5a3a' }}
            title="Agent Configuration"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live session indicator */}
      {isRunning && (
        <div
          className="px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid #1a3020', background: 'rgba(201,168,76,0.04)' }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="dot-pulse flex items-center">
                <span /><span /><span />
              </div>
              <span className="text-[10px] font-mono font-bold" style={{ color: '#C9A84C' }}>
                LIVE SESSION
              </span>
            </div>
            {activeMissionId && (
              <span className="text-[9px] font-mono" style={{ color: '#527052' }}>
                {activeMissionId}
              </span>
            )}
          </div>
          {/* Mini agent status bar */}
          <div className="flex items-center gap-1.5">
            {AGENT_META.map((m) => {
              const st = agentStates?.[m.key]?.status ?? 'idle';
              return (
                <div
                  key={m.key}
                  className="flex flex-col items-center gap-0.5"
                  title={`${m.name}: ${st}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${st === 'thinking' ? 'animate-pulse' : ''}`}
                    style={{
                      background:
                        st === 'done'     ? '#4ade80'  :
                        st === 'thinking' ? '#C9A84C'  : '#1a3020',
                    }}
                  />
                  <span
                    className="text-[7px] font-mono uppercase leading-none"
                    style={{ color: '#2a4a2a' }}
                  >
                    {m.name.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-5 py-10">
            <FolderOpen className="w-8 h-8 mb-3" style={{ color: '#1a3020' }} />
            <p className="text-xs font-mono" style={{ color: '#2a4a2a', lineHeight: 1.5 }}>
              No missions logged.<br />Deploy your first session.
            </p>
          </div>
        ) : (
          history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="w-full text-left px-3 py-3 rounded-lg border transition-all duration-150 group"
              style={{
                background:   selectedId === item.id ? 'rgba(201,168,76,0.06)' : '#080f08',
                borderColor:  selectedId === item.id ? 'rgba(201,168,76,0.3)'  : '#1a3020',
              }}
              onMouseEnter={(e) => {
                if (selectedId !== item.id) {
                  e.currentTarget.style.borderColor = '#2a4a2a';
                  e.currentTarget.style.background  = '#0a150a';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedId !== item.id) {
                  e.currentTarget.style.borderColor = '#1a3020';
                  e.currentTarget.style.background  = '#080f08';
                }
              }}
            >
              {/* Mission ID */}
              {item.missionId && (
                <p className="text-[9px] font-mono mb-1" style={{ color: 'rgba(201,168,76,0.5)' }}>
                  {item.missionId}
                </p>
              )}

              {/* Request text */}
              <p
                className="text-xs leading-snug mb-1.5 line-clamp-2 font-mono"
                style={{ color: selectedId === item.id ? '#b8d8b8' : '#527052' }}
              >
                {item.request}
              </p>

              {/* Agent completion dots */}
              <MiniAgentDots agentOutputs={item.agentOutputs} />

              {/* Timestamp */}
              <div className="flex items-center gap-1 mt-1.5" style={{ color: '#2a4a2a' }}>
                <Clock className="w-2.5 h-2.5" />
                <span className="text-[9px] font-mono">
                  {fmtDate(item.timestamp)} · {fmtTime(item.timestamp)}
                </span>
                {item.totalTokens && (
                  <span className="text-[9px] font-mono ml-auto" style={{ color: '#2a4a2a' }}>
                    {(item.totalTokens.input + item.totalTokens.output).toLocaleString()} tok
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2.5 flex-shrink-0 flex items-center justify-between"
        style={{ borderTop: '1px solid #152015' }}
      >
        <span className="text-[9px] font-mono" style={{ color: '#2a4a2a' }}>
          {history.length} mission{history.length !== 1 ? 's' : ''} logged
        </span>
        <span className="text-[9px] font-mono" style={{ color: '#1a3020' }}>
          LOCAL STORE
        </span>
      </div>
    </aside>
  );
}
