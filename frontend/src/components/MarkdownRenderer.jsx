import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

const FONT_SIZE = { sm: '11.5px', md: '13px', lg: '15px' };
const LINE_HEIGHT = { sm: '1.7', md: '1.8', lg: '1.9' };

export default function MarkdownRenderer({
  content,
  fontSize  = 'md',
  isLight   = false,
  className = '',
  animate   = false,
}) {
  if (!content) return null;

  return (
    <div
      className={`md-body ${isLight ? 'md-light' : 'md-dark'} ${animate ? 'md-fadein' : ''} ${className}`}
      style={{ fontSize: FONT_SIZE[fontSize], lineHeight: LINE_HEIGHT[fontSize] }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
