import React, { useState } from 'react';
import { Plus, RotateCcw, MessageCircle, BookMarked, Loader2, Send } from 'lucide-react';

export default function QuickActionsBar({
  isLight,
  onNewMission,
  onRerunAll,
  onSaveToLibrary,
  isRunning,
  isSaved,
  request,
  onAskFollowUp,
}) {
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpText, setFollowUpText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bg     = isLight ? '#f5f0e8' : '#070f07';
  const border = isLight ? '#d4c8a0' : '#1a3020';
  const text   = isLight ? '#2a2518' : '#b8d8b8';
  const dim    = isLight ? '#9a9070' : '#3a5a3a';

  const btnBase = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', borderRadius: '6px',
    fontSize: '11px', fontFamily: 'monospace', fontWeight: 600,
    cursor: 'pointer', border: `1px solid ${border}`,
    background: 'transparent', color: isLight ? '#5a5030' : '#527052',
    transition: 'all 0.15s',
  };

  const handleFollowUpSubmit = async () => {
    if (!followUpText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await onAskFollowUp(followUpText.trim());
    setFollowUpText('');
    setShowFollowUp(false);
    setIsSubmitting(false);
  };

  return (
    <div className="mb-6">
      {/* Action buttons */}
      <div
        className="flex items-center gap-2 flex-wrap px-4 py-3 rounded-lg"
        style={{ background: bg, border: `1px solid ${border}` }}
      >
        <span className="text-[9px] font-mono uppercase tracking-widest mr-2" style={{ color: dim }}>
          Quick Actions:
        </span>

        <button
          style={btnBase}
          onClick={onNewMission}
          onMouseEnter={(e) => { e.currentTarget.style.color = text; e.currentTarget.style.borderColor = '#C9A84C50'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = isLight ? '#5a5030' : '#527052'; e.currentTarget.style.borderColor = border; }}
          title="Cmd+K"
        >
          <Plus style={{ width: 12, height: 12 }} />
          New Mission
        </button>

        <button
          style={{ ...btnBase, opacity: isRunning ? 0.4 : 1, cursor: isRunning ? 'not-allowed' : 'pointer' }}
          onClick={!isRunning ? onRerunAll : undefined}
          onMouseEnter={(e) => { if (!isRunning) { e.currentTarget.style.color = text; e.currentTarget.style.borderColor = '#C9A84C50'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.color = isLight ? '#5a5030' : '#527052'; e.currentTarget.style.borderColor = border; }}
        >
          {isRunning ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <RotateCcw style={{ width: 12, height: 12 }} />}
          Re-run All
        </button>

        <button
          style={btnBase}
          onClick={() => setShowFollowUp((v) => !v)}
          onMouseEnter={(e) => { e.currentTarget.style.color = text; e.currentTarget.style.borderColor = '#60a5fa50'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = isLight ? '#5a5030' : '#527052'; e.currentTarget.style.borderColor = border; }}
        >
          <MessageCircle style={{ width: 12, height: 12 }} />
          Ask Follow-up
        </button>

        <button
          style={{
            ...btnBase,
            color: isSaved ? '#4ade80' : (isLight ? '#5a5030' : '#527052'),
            borderColor: isSaved ? 'rgba(74,222,128,0.4)' : border,
          }}
          onClick={!isSaved ? onSaveToLibrary : undefined}
          onMouseEnter={(e) => { if (!isSaved) { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.borderColor = '#C9A84C50'; } }}
          onMouseLeave={(e) => { if (!isSaved) { e.currentTarget.style.color = isLight ? '#5a5030' : '#527052'; e.currentTarget.style.borderColor = border; } }}
        >
          <BookMarked style={{ width: 12, height: 12 }} />
          {isSaved ? '✓ Saved' : 'Save to Library'}
        </button>
      </div>

      {/* Follow-up input */}
      {showFollowUp && (
        <div
          className="mt-2 flex gap-2 items-start p-3 rounded-lg"
          style={{ background: bg, border: `1px solid #60a5fa40` }}
        >
          <MessageCircle className="w-3.5 h-3.5 mt-2.5 flex-shrink-0" style={{ color: '#60a5fa' }} />
          <div className="flex-1">
            <p className="text-[10px] font-mono mb-1.5" style={{ color: '#60a5fa80' }}>
              Follow-up question → Director
            </p>
            <textarea
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleFollowUpSubmit(); }}
              placeholder="Ask Director a follow-up question about this session…"
              rows={2}
              className="w-full bg-transparent outline-none resize-none font-mono text-xs"
              style={{ color: text, lineHeight: 1.6 }}
              autoFocus
            />
          </div>
          <button
            onClick={handleFollowUpSubmit}
            disabled={!followUpText.trim() || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-mono mt-4"
            style={{
              background: followUpText.trim() ? 'rgba(96,165,250,0.15)' : 'transparent',
              border: `1px solid ${followUpText.trim() ? 'rgba(96,165,250,0.4)' : border}`,
              color: followUpText.trim() ? '#60a5fa' : dim,
              cursor: followUpText.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
            }}
          >
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          </button>
        </div>
      )}
    </div>
  );
}
