import React from 'react';
import { Link } from 'react-router-dom';
import './SourceCard.css';

export default function SourceCard({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="source-card">
      <div className="source-card-header">
          <span className="source-title">Supporting Records</span>
      </div>
      <div className="source-list">
        {sources.map((src, i) => src.document_id ? (
          <Link to={`/doctor/documents/${src.document_id}`} state={{ page: src.page, filename: src.filename }} key={`${src.document_id}-${src.page}-${i}`} className="source-item" style={{ '--source-index': i }}>
            <span className="source-filename">{src.filename}</span>
            <span className="source-page">Page {src.page}</span>
          </Link>
        ) : (
          <div key={`${src.filename}-${src.page}-${i}`} className="source-item" style={{ '--source-index': i }}>
            <span className="source-filename">{src.filename}</span>
            <span className="source-page">Page {src.page}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
