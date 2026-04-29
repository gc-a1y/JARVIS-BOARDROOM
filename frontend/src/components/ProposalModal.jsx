import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText, Loader2 } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer.jsx';

export default function ProposalModal({ content, isLoading, isLight, fontSize, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    try { await navigator.clipboard.writeText(content); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = content; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'client-proposal.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  const bg     = isLight ? '#faf8f2' : '#060e06';
  const border = isLight ? '#d4c8a0' : '#1a3020';
  const dim    = isLight ? '#9a9070' : '#3a5a3a';

  const toolBtn = (active) => ({
    display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
    borderRadius: 5, fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
    color: active ? '#4ade80' : '#C9A84C',
    border: `1px solid ${active ? 'rgba(74,222,128,0.3)' : 'rgba(201,168,76,0.3)'}`,
    background: active ? 'rgba(74,222,128,0.1)' : 'rgba(201,168,76,0.08)',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex flex-col rounded-xl overflow-hidden"
        style={{
          width: '90vw', maxWidth: '760px', maxHeight: '88vh',
          background: bg, border: `1px solid ${border}`,
          boxShadow: '0 40px 120px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${border}`, background: isLight ? '#f5f0e8' : '#070f07' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              <FileText className="w-4 h-4" style={{ color: '#C9A84C' }} />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold" style={{ color: '#C9A84C' }}>Client Proposal</h2>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: dim }}>Ready to send to your client</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {content && (
              <>
                <button onClick={handleCopy} style={toolBtn(copied)}>
                  {copied ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={handleExport}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 5, fontSize: 11, fontFamily: 'monospace', fontWeight: 600, cursor: 'pointer', border: `1px solid ${border}`, background: 'transparent', color: dim }}
                >
                  <Download style={{ width: 12, height: 12 }} /> Export .txt
                </button>
              </>
            )}
            <button onClick={onClose} className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10" style={{ color: dim }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C9A84C' }} />
              <p className="text-sm font-mono" style={{ color: dim }}>Drafting your proposal…</p>
            </div>
          )}
          {!isLoading && content && (
            <MarkdownRenderer content={content} fontSize={fontSize} isLight={isLight} animate />
          )}
        </div>
      </div>
    </div>
  );
}
