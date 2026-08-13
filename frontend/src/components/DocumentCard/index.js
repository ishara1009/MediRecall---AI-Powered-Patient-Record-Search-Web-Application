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

export default function DocumentCard({ doc, onDelete, onRebuild, onEdit, isDeleting, isRebuilding }) {
  return (
    <div className="doc-card glass">
      <div className="doc-patient">
        {doc.patientPhoto ? (
          <img src={`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/uploads/${doc.patientPhoto}`} alt={doc.patientName} />
        ) : <span>{doc.patientName?.charAt(0) || '?'}</span>}
        <div><strong>{doc.patientName || 'Legacy record'}</strong><small>{doc.patientId || 'No patient ID'}</small></div>
      </div>
      {doc.diseases?.length > 0 && <p className="doc-diseases">{doc.diseases.join(', ')}</p>}
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
        <button className="doc-btn edit-btn" onClick={() => onEdit(doc)}>Edit Patient</button>
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
