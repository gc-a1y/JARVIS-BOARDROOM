import React from 'react';
import { MessageSquare, Clock, History } from 'lucide-react';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ConversationSidebar({ history, onSelectItem, selectedId }) {
  return (
    <aside className="w-72 bg-[#0d0d0d] border-r border-[#1c1c1c] flex flex-col flex-shrink-0 h-screen overflow-hidden">
      {/* Header */}
      <div className="px-5 py-5 border-b border-[#1c1c1c]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-md bg-[#C9A84C] flex items-center justify-center flex-shrink-0">
            <span className="text-black font-bold text-xs">J</span>
          </div>
          <span className="text-white font-bold tracking-wide text-sm">
            JARVIS <span className="text-[#C9A84C]">BOARD</span>
          </span>
        </div>
        <p className="text-[10px] text-gray-600 uppercase tracking-widest ml-9">
          AI Agent Boardroom
        </p>
      </div>

      <div className="px-4 py-3 border-b border-[#1c1c1c]">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-[#C9A84C]" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C9A84C]">
            Mission History
          </span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <MessageSquare className="w-10 h-10 text-[#1f1f1f] mb-4" />
            <p className="text-xs text-gray-700 leading-relaxed">
              No missions yet.<br />Deploy your first session above.
            </p>
          </div>
        ) : (
          history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectItem(item)}
              className={`
                w-full text-left px-3 py-3 rounded-lg border transition-all duration-150 group
                ${selectedId === item.id
                  ? 'bg-[#1a1510] border-[#C9A84C]/40 shadow-[0_0_10px_rgba(201,168,76,0.08)]'
                  : 'bg-[#111111] border-[#1c1c1c] hover:bg-[#161616] hover:border-[#2a2a2a]'}
              `}
            >
              <p className={`text-xs leading-relaxed mb-2 line-clamp-2 ${selectedId === item.id ? 'text-gray-200' : 'text-gray-400 group-hover:text-gray-300'}`}>
                {item.request}
              </p>
              <div className="flex items-center gap-1.5 text-gray-700">
                <Clock className="w-2.5 h-2.5" />
                <span className="text-[10px]">
                  {formatDate(item.timestamp)} · {formatTime(item.timestamp)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1c1c1c]">
        <p className="text-[10px] text-gray-700 text-center">
          {history.length} mission{history.length !== 1 ? 's' : ''} completed
        </p>
      </div>
    </aside>
  );
}
