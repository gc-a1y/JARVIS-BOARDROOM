import React, { useState } from 'react';
import { X, Copy, Check, Code2, Terminal } from 'lucide-react';

export function extractClaudeCodePrompt(content) {
  if (!content) return null;
  // Case-insensitive search — handles CLAUDE CODE PROMPT:, ## Claude Code Prompt:, **CLAUDE CODE PROMPT:**, etc.
  const idx = content.toLowerCase().indexOf('claude code prompt');
  if (idx === -1) return null;
  // Skip to the end of the header line so we don't include the heading itself
  const lineEnd = content.indexOf('\n', idx);
  if (lineEnd === -1) return null; // nothing follows the header
  const raw = content.slice(lineEnd + 1).trim();
  // Strip a single surrounding markdown fence block if present
  return raw.replace(/^```[\w]*\n?/, '').replace(/\n?```\s*$/, '').trim() || null;
}

export default function ClaudeCodeModal({ directorContent, isLight, onClose }) {
  const prompt = extractClaudeCodePrompt(directorContent);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!prompt) return;
    try { await navigator.clipboard.writeText(prompt); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bg     = isLight ? '#faf8f2' : '#060e06';
  const border = isLight ? '#d4c8a0' : '#1a3020';
  const text   = isLight ? '#2a2518' : '#b8d8b8';
  const dim    = isLight ? '#9a9070' : '#3a5a3a';
  const codeBg = isLight ? '#f0ede4' : '#040a04';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col rounded-xl overflow-hidden"
        style={{
          width: '90vw', maxWidth: '720px', maxHeight: '85vh',
          background: bg, border: `1px solid ${border}`,
          boxShadow: '0 40px 120px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${border}`, background: isLight ? '#f5f0e8' : '#070f07' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              <Terminal className="w-4 h-4" style={{ color: '#C9A84C' }} />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold" style={{ color: '#C9A84C' }}>
                Claude Code Prompt
              </h2>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: dim }}>
                Copy and paste directly into Claude Code
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-classified">READY TO USE</span>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10"
              style={{ color: dim }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Prompt body */}
        <div className="flex-1 overflow-y-auto p-5">
          {prompt ? (
            <pre
              className="font-mono text-sm leading-relaxed whitespace-pre-wrap rounded-lg p-4"
              style={{ background: codeBg, color: text, border: `1px solid ${border}`, fontSize: '12.5px' }}
            >
              {prompt}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Code2 className="w-10 h-10 mb-4 opacity-20" style={{ color: '#C9A84C' }} />
              <p className="text-sm font-mono" style={{ color: dim }}>
                No Claude Code Prompt found in Director's response.<br />
                Complete a session to generate one.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {prompt && (
          <div
            className="flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{ borderTop: `1px solid ${border}`, background: isLight ? '#f5f0e8' : '#050c05' }}
          >
            <p className="text-[10px] font-mono" style={{ color: dim }}>
              {prompt.length.toLocaleString()} characters
            </p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-mono font-bold transition-all"
              style={{
                background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(201,168,76,0.15)',
                border: `1px solid ${copied ? 'rgba(74,222,128,0.4)' : 'rgba(201,168,76,0.4)'}`,
                color: copied ? '#4ade80' : '#C9A84C',
              }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Prompt'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
