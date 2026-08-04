import React, { useState } from 'react';
import SourceCard from '../SourceCard';
import './AnswerCard.css';

export default function AnswerCard({ data }) {
  const [copied, setCopied] = useState(false);
  const [showContext, setShowContext] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidenceColor = data.confidence_score >= 75
    ? 'var(--accent-green)'
    : data.confidence_score >= 40
    ? 'var(--accent-amber)'
    : 'var(--accent-error)';

  return (
    <div className="answer-card">
      <div className="answer-header">
        <div className="answer-badge">
          <span>AI Answer</span>
        </div>
        <div className="answer-actions">
          <div
            className="confidence-badge"
            style={{ borderColor: `${confidenceColor}40`, color: confidenceColor }}
          >
            <span>Confidence: {Math.round(data.confidence_score)}%</span>
          </div>
          <button id="copy-answer-btn" className="copy-btn" onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="answer-body">
        <p className="answer-text">{data.answer}</p>
      </div>

      <SourceCard sources={data.sources} />

      {data.context_references && data.context_references.length > 0 && (
        <div className="context-section">
          <button
            className="context-toggle"
            onClick={() => setShowContext(!showContext)}
          >
            {showContext ? 'Hide Retrieved Context' : 'Show Retrieved Context'}
          </button>
          {showContext && (
            <div className="context-list">
              {data.context_references.map((ctx, i) => (
                <div key={i} className="context-item">
                  <span className="context-num">#{i + 1}</span>
                  <p className="context-text">{ctx.slice(0, 300)}{ctx.length > 300 ? '...' : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
