import React from 'react';
import './SourceCard.css';

export default function SourceCard({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="source-card">
      <div className="source-card-header">
        <span className="source-title">Source Documents</span>
      </div>
      <div className="source-list">
        {sources.map((src, i) => (
          <div key={i} className="source-item">
            <span className="source-filename">{src.filename}</span>
            <span className="source-page">Page {src.page}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
