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
          <span>Record Summary</span>
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

      {data.showRetrievedContext && data.context_references?.length > 0 && (
        <div className="context-section">
          <button className="context-toggle" onClick={() => setShowContext(prev => !prev)}>
            {showContext ? 'Hide Retrieved Context' : 'Show Retrieved Context'}
          </button>
          {showContext && (
            <div className="context-list">
              {data.context_references.map((context, index) => (
                <div className="context-item" key={index}>
                  <span className="context-num">#{index + 1}</span>
                  <p className="context-text">
                    {context.slice(0, 500)}{context.length > 500 ? '…' : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
