import React, { useState } from 'react';
import SourceCard from '../SourceCard';
import './AnswerCard.css';

export default function AnswerCard({ data }) {
  const [showContext, setShowContext] = useState(false);

  return (
    <div className="answer-card">
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
