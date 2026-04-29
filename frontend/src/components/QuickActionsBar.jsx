import React, { useState } from 'react';
import {
  Plus, RotateCcw, MessageCircle, BookMarked, Loader2, Send,
  Mail, ExternalLink, FileText, ClipboardList,
} from 'lucide-react';

export default function QuickActionsBar({
  isLight, onNewMission, onRerunAll, onSaveToLibrary,
  isRunning, isSaved, request, onAskFollowUp,
  onEmailSummary, onNotionExport, onGenerateProposal, onGeneratePlan,
}) {
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpText, setFollowUpText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bg       = isLight ? '#f5f0e8' : '#070f07';
  const border   = isLight ? '#d4c8a0' : '#1a3020';
  const text     = isLight ? '#2a2518' : '#b8d8b8';
  const dim      = isLight ? '#9a9070' : '#3a5a3a';
  const btnColor = isLight ? '#5a5030' : '#527052';

  const btn = {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 11px', borderRadius: 5,
    fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
    cursor: 'pointer', border: `1px solid ${border}`,
    background: 'transparent', color: btnColor, transition: 'all 0.15s',
  };
  const hoverGold  = e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; };
  const hoverBlue  = e => { e.currentTarget.style.color = '#60a5fa'; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.4)'; };
  const hoverGreen = e => { e.currentTarget.style.color = '#4ade80'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.4)'; };
  const hoverOut   = e => { e.currentTarget.style.color = btnColor; e.currentTarget.style.borderColor = border; };

  const handleFollowUpSubmit = async () => {
    if (!followUpText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await onAskFollowUp(followUpText.trim());
    setFollowUpText(''); setShowFollowUp(false); setIsSubmitting(false);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 flex-wrap px-4 py-3 rounded-lg"
        style={{ background: bg, border: `1px solid ${border}` }}
      >
        <span className="text-[9px] font-mono uppercase tracking-widest mr-1 flex-shrink-0" style={{ color: dim }}>
          Actions:
        </span>

        <button style={btn} onClick={onNewMission} onMouseEnter={hoverGold} onMouseLeave={hoverOut} title="⌘K">
          <Plus style={{ width: 11, height: 11 }} /> New Mission
        </button>

        <button
          style={{ ...btn, opacity: isRunning ? 0.4 : 1, cursor: isRunning ? 'not-allowed' : 'pointer' }}
          onClick={!isRunning ? onRerunAll : undefined}
          onMouseEnter={e => { if (!isRunning) hoverGold(e); }}
          onMouseLeave={hoverOut}
        >
          {isRunning
            ? <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" />
            : <RotateCcw style={{ width: 11, height: 11 }} />}
          Re-run All
        </button>

        <button style={btn} onClick={() => setShowFollowUp(v => !v)} onMouseEnter={hoverBlue} onMouseLeave={hoverOut}>
          <MessageCircle style={{ width: 11, height: 11 }} /> Ask Follow-up
        </button>

        <button
          style={{ ...btn, color: isSaved ? '#4ade80' : btnColor, borderColor: isSaved ? 'rgba(74,222,128,0.4)' : border }}
          onClick={!isSaved ? onSaveToLibrary : undefined}
          onMouseEnter={e => { if (!isSaved) hoverGold(e); }}
          onMouseLeave={e => { if (!isSaved) hoverOut(e); }}
        >
          <BookMarked style={{ width: 11, height: 11 }} />
          {isSaved ? '✓ Saved' : 'Save to Library'}
        </button>

        <div className="w-px h-4 flex-shrink-0" style={{ background: border }} />

        <button style={btn} onClick={onEmailSummary} onMouseEnter={hoverBlue} onMouseLeave={hoverOut} title="Email summary to yourself">
          <Mail style={{ width: 11, height: 11 }} /> Email Summary
        </button>

        <button style={btn} onClick={onNotionExport} onMouseEnter={hoverGreen} onMouseLeave={hoverOut} title="Export to Notion database">
          <ExternalLink style={{ width: 11, height: 11 }} /> Notion Export
        </button>

        <button style={btn} onClick={onGenerateProposal} onMouseEnter={hoverGold} onMouseLeave={hoverOut} title="Generate client proposal">
          <FileText style={{ width: 11, height: 11 }} /> Generate Proposal
        </button>

        <button style={btn} onClick={onGeneratePlan} onMouseEnter={hoverGreen} onMouseLeave={hoverOut} title="Generate project action plan">
          <ClipboardList style={{ width: 11, height: 11 }} /> Generate Plan
        </button>
      </div>

      {showFollowUp && (
        <div className="mt-2 flex gap-2 items-start p-3 rounded-lg"
          style={{ background: bg, border: '1px solid rgba(96,165,250,0.25)' }}
        >
          <MessageCircle className="w-3.5 h-3.5 mt-2.5 flex-shrink-0" style={{ color: '#60a5fa' }} />
          <div className="flex-1">
            <p className="text-[10px] font-mono mb-1.5" style={{ color: 'rgba(96,165,250,0.6)' }}>
              Follow-up question → Director
            </p>
            <textarea
              value={followUpText}
              onChange={e => setFollowUpText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleFollowUpSubmit(); }}
              placeholder="Ask Director a follow-up about this session…"
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
