import React, { useState } from 'react';
import { Clock, FolderOpen, BookMarked, Settings } from 'lucide-react';
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

function MiniAgentDots({ agentOutputs }) {
  return (
    <div className="flex items-center gap-0.5 mt-1.5">
      {AGENT_META.map((m) => (
        <div
          key={m.key}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: agentOutputs?.[m.key] ? m.color : '#1a3020',
            opacity:    agentOutputs?.[m.key] ? 0.8 : 0.4,
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
  library,
  onLibrarySelect,
  isLight,
}) {
  const [activeTab, setActiveTab] = useState('log'); // 'log' | 'library'

  // Theme
  const bg      = isLight ? '#f5f2eb' : '#050d05';
  const bdr     = isLight ? '#d4c8a0' : '#1a3020';
  const bdrSub  = isLight ? '#e8e0c8' : '#152015';
  const textDim  = isLight ? '#9a9070' : '#527052';
  const textMeta = isLight ? '#7a7060' : '#2a4a2a';
  const itemBg   = isLight ? '#faf8f2' : '#080f08';
  const itemSelBg  = isLight ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.06)';
  const itemSelBdr = 'rgba(201,168,76,0.3)';
  const tabActive  = isLight ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.08)';

  const tabBtn = (tab) => ({
    flex: 1, padding: '6px 0',
    fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.12em',
    cursor: 'pointer', border: 'none',
    background:  activeTab === tab ? tabActive : 'transparent',
    color:       activeTab === tab ? '#C9A84C' : textDim,
    borderBottom: activeTab === tab ? '2px solid rgba(201,168,76,0.5)' : `2px solid transparent`,
    transition:  'all 0.15s',
  });

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-full overflow-hidden"
      style={{ width: 272, background: bg, borderRight: `1px solid ${bdr}` }}
    >
      {/* Title bar */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${bdrSub}` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-3.5 h-3.5" style={{ color: textDim }} />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: textDim }}>
              JARVIS Files
            </span>
          </div>
          <button
            onClick={onSettingsClick}
            className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-black/10"
            style={{ color: textMeta }}
            title="Agent Configuration"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex mt-3" style={{ borderBottom: `1px solid ${bdrSub}` }}>
          <button style={tabBtn('log')} onClick={() => setActiveTab('log')}>
            Mission Log {history.length > 0 && `(${history.length})`}
          </button>
          <button style={tabBtn('library')} onClick={() => setActiveTab('library')}>
            <BookMarked style={{ width: 9, height: 9, display: 'inline', marginRight: 3 }} />
            Library {library?.length > 0 && `(${library.length})`}
          </button>
        </div>
      </div>

      {/* Live session indicator (log tab only) */}
      {isRunning && activeTab === 'log' && (
        <div
          className="px-4 py-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${bdr}`, background: 'rgba(201,168,76,0.04)' }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="dot-pulse flex items-center"><span /><span /><span /></div>
              <span className="text-[10px] font-mono font-bold" style={{ color: '#C9A84C' }}>LIVE SESSION</span>
            </div>
            {activeMissionId && (
              <span className="text-[9px] font-mono" style={{ color: textDim }}>{activeMissionId}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {AGENT_META.map((m) => {
              const st = agentStates?.[m.key]?.status ?? 'idle';
              return (
                <div key={m.key} className="flex flex-col items-center gap-0.5" title={`${m.name}: ${st}`}>
                  <div
                    className={`w-2 h-2 rounded-full ${st === 'thinking' ? 'animate-pulse' : ''}`}
                    style={{
                      background:
                        st === 'done'     ? '#4ade80' :
                        st === 'thinking' ? '#C9A84C' : '#1a3020',
                    }}
                  />
                  <span className="text-[7px] font-mono uppercase leading-none" style={{ color: textMeta }}>
                    {m.name.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Mission Log tab ── */}
      {activeTab === 'log' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-5 py-10">
              <FolderOpen className="w-8 h-8 mb-3" style={{ color: isLight ? '#d4c8a0' : '#1a3020' }} />
              <p className="text-xs font-mono" style={{ color: textMeta, lineHeight: 1.5 }}>
                No missions logged.<br />Deploy your first session.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const isSelected = selectedId === item.id;
              const displayTitle = item.title || item.request;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="w-full text-left px-3 py-3 rounded-lg border transition-all duration-150"
                  style={{
                    background:  isSelected ? itemSelBg : itemBg,
                    borderColor: isSelected ? itemSelBdr : bdr,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = isLight ? '#c4b890' : '#2a4a2a';
                      e.currentTarget.style.background  = isLight ? '#f5f0e8' : '#0a150a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = bdr;
                      e.currentTarget.style.background  = itemBg;
                    }
                  }}
                >
                  {item.missionId && (
                    <p className="text-[9px] font-mono mb-1" style={{ color: 'rgba(201,168,76,0.5)' }}>
                      {item.missionId}
                    </p>
                  )}
                  <p
                    className="text-xs leading-snug mb-1.5 line-clamp-2 font-mono"
                    style={{ color: isSelected ? (isLight ? '#2a2518' : '#b8d8b8') : textDim }}
                  >
                    {displayTitle}
                  </p>
                  <MiniAgentDots agentOutputs={item.agentOutputs} />
                  <div className="flex items-center gap-1 mt-1.5" style={{ color: textMeta }}>
                    <Clock className="w-2.5 h-2.5" />
                    <span className="text-[9px] font-mono">
                      {fmtDate(item.timestamp)} · {fmtTime(item.timestamp)}
                    </span>
                    {item.totalTokens && (
                      <span className="text-[9px] font-mono ml-auto" style={{ color: textMeta }}>
                        {(item.totalTokens.input + item.totalTokens.output).toLocaleString()} tok
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* ── Library tab ── */}
      {activeTab === 'library' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {!library?.length ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-5 py-10">
              <BookMarked className="w-8 h-8 mb-3" style={{ color: isLight ? '#d4c8a0' : '#1a3020' }} />
              <p className="text-xs font-mono" style={{ color: textMeta, lineHeight: 1.5 }}>
                No saved sessions.<br />Use "Save to Library" after a mission.
              </p>
            </div>
          ) : (
            library.map((item) => (
              <button
                key={item.libId}
                onClick={() => onLibrarySelect?.(item)}
                className="w-full text-left px-3 py-3 rounded-lg border transition-all duration-150"
                style={{ background: itemBg, borderColor: bdr }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = isLight ? '#c4b890' : '#2a4a2a';
                  e.currentTarget.style.background  = isLight ? '#f5f0e8' : '#0a150a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = bdr;
                  e.currentTarget.style.background  = itemBg;
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  {item.missionId && (
                    <p className="text-[9px] font-mono" style={{ color: 'rgba(201,168,76,0.5)' }}>
                      {item.missionId}
                    </p>
                  )}
                  <span className="text-[9px] font-mono ml-auto" style={{ color: '#4ade8070' }}>★ saved</span>
                </div>
                <p className="text-xs leading-snug mb-1.5 line-clamp-2 font-mono" style={{ color: textDim }}>
                  {item.title || item.request}
                </p>
                <MiniAgentDots agentOutputs={item.agentOutputs} />
                <div className="flex items-center gap-1 mt-1.5" style={{ color: textMeta }}>
                  <Clock className="w-2.5 h-2.5" />
                  <span className="text-[9px] font-mono">
                    {fmtDate(item.savedAt)} · {fmtTime(item.savedAt)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Footer */}
      <div
        className="px-4 py-2.5 flex-shrink-0 flex items-center justify-between"
        style={{ borderTop: `1px solid ${bdrSub}` }}
      >
        <span className="text-[9px] font-mono" style={{ color: textMeta }}>
          {activeTab === 'log'
            ? `${history.length} mission${history.length !== 1 ? 's' : ''} logged`
            : `${library?.length ?? 0} saved`}
        </span>
        <span className="text-[9px] font-mono" style={{ color: isLight ? '#d4c8a0' : '#1a3020' }}>
          LOCAL STORE
        </span>
      </div>
    </aside>
  );
}
