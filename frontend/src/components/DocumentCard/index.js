import React from 'react';
import './DocumentCard.css';

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

export default function DocumentCard({ doc, onDelete, onRebuild, isDeleting, isRebuilding }) {
  return (
    <div className="doc-card glass">
      <div className="doc-card-header">
        <div className="doc-info">
          <h4 className="doc-filename" title={doc.filename}>{doc.filename}</h4>
          <p className="doc-date">Uploaded {formatDate(doc.uploadDate)}</p>
        </div>
      </div>
      <div className="doc-stats">
        <div className="doc-stat">
          <span className="stat-label">Pages</span>
          <span className="stat-value">{doc.totalPages}</span>
        </div>
        <div className="doc-stat">
          <span className="stat-label">Size</span>
          <span className="stat-value">{formatBytes(doc.fileSize)}</span>
        </div>
      </div>
      <div className="doc-card-actions">
        <button
          id={`rebuild-btn-${doc._id}`}
          className="doc-btn rebuild-btn"
          onClick={() => onRebuild(doc._id)}
          disabled={isRebuilding}
        >
          {isRebuilding ? 'Rebuilding...' : 'Rebuild'}
        </button>
        <button
          id={`delete-btn-${doc._id}`}
          className="doc-btn delete-btn"
          onClick={() => onDelete(doc._id)}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
