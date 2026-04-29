import React, { useState } from 'react';
import { Clock, FolderOpen, BookMarked, Settings, Star, X, MessageSquare, Filter } from 'lucide-react';
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

const TAG_PALETTE = ['#C9A84C', '#60a5fa', '#4ade80', '#f87171', '#a78bfa', '#fbbf24', '#34d399'];
function tagColor(tag) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = tag.charCodeAt(i) + ((h << 5) - h);
  return TAG_PALETTE[Math.abs(h) % TAG_PALETTE.length];
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
  pinnedIds,
  onPinToggle,
  missionTags,
  tagFilter,
  onTagFilter,
  onFollowUp,
  favorites,
  onDeleteFavorite,
}) {
  const [activeTab,  setActiveTab]  = useState('log');
  const [libSection, setLibSection] = useState('sessions');

  const bg         = isLight ? '#f5f2eb' : '#050d05';
  const bdr        = isLight ? '#d4c8a0' : '#1a3020';
  const bdrSub     = isLight ? '#e8e0c8' : '#152015';
  const textDim    = isLight ? '#9a9070' : '#527052';
  const textMeta   = isLight ? '#7a7060' : '#2a4a2a';
  const itemBg     = isLight ? '#faf8f2' : '#080f08';
  const itemSelBg  = isLight ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.06)';
  const itemSelBdr = 'rgba(201,168,76,0.3)';
  const tabActive  = isLight ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.08)';

  const tabBtn = (tab) => ({
    flex: 1, padding: '6px 0',
    fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.12em',
    cursor: 'pointer', border: 'none',
    background:   activeTab === tab ? tabActive : 'transparent',
    color:        activeTab === tab ? '#C9A84C' : textDim,
    borderBottom: activeTab === tab ? '2px solid rgba(201,168,76,0.5)' : '2px solid transparent',
    transition:   'all 0.15s',
  });

  const allTags = [...new Set(Object.values(missionTags ?? {}).flat())];

  const sortedHistory = [...history].sort((a, b) => {
    const ap = pinnedIds?.has(a.id) ? 1 : 0;
    const bp = pinnedIds?.has(b.id) ? 1 : 0;
    return bp - ap;
  });

  const filteredHistory = tagFilter
    ? sortedHistory.filter((item) => (missionTags?.[item.id] ?? []).includes(tagFilter))
    : sortedHistory;

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
            Library {(library?.length || 0) + (favorites?.length || 0) > 0 && `(${(library?.length || 0) + (favorites?.length || 0)})`}
          </button>
        </div>

        {/* Tag filter bar (log tab only) */}
        {activeTab === 'log' && allTags.length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            <Filter style={{ width: 9, height: 9, color: textMeta, flexShrink: 0 }} />
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagFilter?.(tagFilter === tag ? null : tag)}
                className="text-[8px] font-mono px-1.5 py-0.5 rounded border"
                style={{
                  color:        tagFilter === tag ? '#C9A84C' : tagColor(tag),
                  borderColor:  tagFilter === tag ? 'rgba(201,168,76,0.4)' : `${tagColor(tag)}40`,
                  background:   tagFilter === tag ? 'rgba(201,168,76,0.1)' : 'transparent',
                  cursor:       'pointer',
                }}
              >
                {tag}
              </button>
            ))}
            {tagFilter && (
              <button
                onClick={() => onTagFilter?.(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMeta, padding: 0 }}
              >
                <X style={{ width: 8, height: 8 }} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Live session indicator */}
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
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-5 py-10">
              <FolderOpen className="w-8 h-8 mb-3" style={{ color: isLight ? '#d4c8a0' : '#1a3020' }} />
              <p className="text-xs font-mono" style={{ color: textMeta, lineHeight: 1.5 }}>
                {tagFilter
                  ? `No missions tagged "${tagFilter}".`
                  : 'No missions logged.\nDeploy your first session.'}
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => {
              const isSelected = selectedId === item.id;
              const isPinned   = pinnedIds?.has(item.id);
              const itemTags   = missionTags?.[item.id] ?? [];
              const hasOutput  = item.agentOutputs && Object.keys(item.agentOutputs).length > 0;

              return (
                <div key={item.id} className="relative group/card">
                  <button
                    onClick={() => onSelectItem(item)}
                    className="w-full text-left px-3 py-3 rounded-lg border transition-all duration-150"
                    style={{
                      background:  isSelected ? itemSelBg : itemBg,
                      borderColor: isPinned
                        ? 'rgba(201,168,76,0.35)'
                        : isSelected ? itemSelBdr : bdr,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = isLight ? '#c4b890' : '#2a4a2a';
                        e.currentTarget.style.background  = isLight ? '#f5f0e8' : '#0a150a';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = isPinned ? 'rgba(201,168,76,0.35)' : bdr;
                        e.currentTarget.style.background  = itemBg;
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      {item.missionId && (
                        <p className="text-[9px] font-mono" style={{ color: 'rgba(201,168,76,0.5)' }}>
                          {item.missionId}
                        </p>
                      )}
                      {isPinned && (
                        <Star className="w-2.5 h-2.5 ml-auto" style={{ color: '#C9A84C', fill: '#C9A84C' }} />
                      )}
                    </div>

                    <p
                      className="text-xs leading-snug mb-1.5 line-clamp-2 font-mono"
                      style={{ color: isSelected ? (isLight ? '#2a2518' : '#b8d8b8') : textDim }}
                    >
                      {item.title || item.request}
                    </p>

                    {itemTags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mb-1">
                        {itemTags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[7px] font-mono px-1.5 py-0.5 rounded"
                            style={{
                              color:       tagColor(tag),
                              background:  `${tagColor(tag)}18`,
                              border:      `1px solid ${tagColor(tag)}40`,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

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

                  {/* Hover action buttons (pin + follow-up) */}
                  <div
                    className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); onPinToggle?.(item.id); }}
                      className="w-5 h-5 rounded flex items-center justify-center"
                      style={{
                        background: isPinned ? 'rgba(201,168,76,0.15)' : (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.4)'),
                        border:     `1px solid ${isPinned ? 'rgba(201,168,76,0.4)' : bdr}`,
                        color:      isPinned ? '#C9A84C' : textMeta,
                        cursor:     'pointer',
                      }}
                      title={isPinned ? 'Unpin' : 'Pin mission'}
                    >
                      <Star style={{ width: 9, height: 9, fill: isPinned ? '#C9A84C' : 'transparent' }} />
                    </button>

                    {hasOutput && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onFollowUp?.(item); }}
                        className="w-5 h-5 rounded flex items-center justify-center"
                        style={{
                          background: 'rgba(96,165,250,0.1)',
                          border:     '1px solid rgba(96,165,250,0.3)',
                          color:      '#60a5fa',
                          cursor:     'pointer',
                        }}
                        title="Follow up on this mission"
                      >
                        <MessageSquare style={{ width: 9, height: 9 }} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Library tab ── */}
      {activeTab === 'library' && (
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Library sub-tabs */}
          <div className="flex px-3 pt-2 gap-1 flex-shrink-0" style={{ borderBottom: `1px solid ${bdrSub}` }}>
            {[['sessions', 'Saved'], ['favorites', 'Favorites']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setLibSection(key)}
                className="px-2 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider"
                style={{
                  color:        libSection === key ? '#C9A84C' : textDim,
                  background:   libSection === key ? tabActive : 'transparent',
                  border:       'none',
                  borderBottom: libSection === key ? '2px solid rgba(201,168,76,0.5)' : '2px solid transparent',
                  cursor:       'pointer',
                }}
              >
                {label}
                {key === 'favorites' && favorites?.length > 0 && ` (${favorites.length})`}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {/* Saved sessions */}
            {libSection === 'sessions' && (
              !library?.length ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-5">
                  <BookMarked className="w-8 h-8 mb-3" style={{ color: isLight ? '#d4c8a0' : '#1a3020' }} />
                  <p className="text-xs font-mono" style={{ color: textMeta, lineHeight: 1.5 }}>
                    No saved sessions.<br />Use "Save to Library" after a mission.
                  </p>
                </div>
              ) : library.map((item) => (
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

            {/* Favorites */}
            {libSection === 'favorites' && (
              !favorites?.length ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-5">
                  <Star className="w-8 h-8 mb-3" style={{ color: isLight ? '#d4c8a0' : '#1a3020' }} />
                  <p className="text-xs font-mono" style={{ color: textMeta, lineHeight: 1.5 }}>
                    No favorites yet.<br />Star a response in the agent panel.
                  </p>
                </div>
              ) : favorites.map((fav, idx) => (
                <div
                  key={fav.id ?? idx}
                  className="px-3 py-3 rounded-lg border"
                  style={{ background: itemBg, borderColor: bdr }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono font-bold" style={{ color: '#C9A84C' }}>
                      ★ {fav.agentName}
                    </span>
                    <button
                      onClick={() => onDeleteFavorite?.(fav.id ?? idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: 2 }}
                      title="Remove favorite"
                    >
                      <X style={{ width: 8, height: 8 }} />
                    </button>
                  </div>
                  {fav.missionTitle && (
                    <p className="text-[9px] font-mono mb-1" style={{ color: textMeta }}>
                      {fav.missionTitle}
                    </p>
                  )}
                  <p className="text-[10px] font-mono line-clamp-3 leading-relaxed" style={{ color: textDim }}>
                    {fav.content?.slice(0, 180)}{(fav.content?.length ?? 0) > 180 ? '…' : ''}
                  </p>
                  {fav.savedAt && (
                    <p className="text-[8px] font-mono mt-1.5" style={{ color: textMeta }}>
                      {fmtDate(fav.savedAt)} · {fmtTime(fav.savedAt)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
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
            : `${library?.length ?? 0} saved · ${favorites?.length ?? 0} favs`}
        </span>
        <span className="text-[9px] font-mono" style={{ color: isLight ? '#d4c8a0' : '#1a3020' }}>
          LOCAL STORE
        </span>
      </div>
    </aside>
  );
}
