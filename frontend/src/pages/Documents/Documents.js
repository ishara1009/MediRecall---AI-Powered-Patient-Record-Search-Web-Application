import React, { useEffect, useState } from 'react';
import { getDocuments, deleteDocument, rebuildDocument, rebuildAllDocuments } from '../../api/api';
import DocumentCard from '../../components/DocumentCard';
import Loader from '../../components/Loader';
import './Documents.css';

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [rebuildingId, setRebuildingId] = useState(null);
  const [rebuildingAll, setRebuildingAll] = useState(false);
  const [message, setMessage] = useState('');

  const fetchDocs = async () => {
    try {
      const res = await getDocuments();
      setDocs(res.data || []);
    } catch {
      setMessage('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document and its embeddings?')) return;
    setDeletingId(id);
    try {
      await deleteDocument(id);
      setDocs(prev => prev.filter(d => d._id !== id));
      setMessage('Document deleted successfully.');
    } catch {
      setMessage('Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRebuild = async (id) => {
    setRebuildingId(id);
    setMessage('');
    try {
      await rebuildDocument(id);
      setMessage('Embeddings rebuilt successfully.');
    } catch {
      setMessage('Failed to rebuild embeddings.');
    } finally {
      setRebuildingId(null);
    }
  };

  const handleRebuildAll = async () => {
    if (!window.confirm('Rebuild embeddings for ALL documents? This may take a while.')) return;
    setRebuildingAll(true);
    setMessage('');
    try {
      await rebuildAllDocuments();
      setMessage('All embeddings rebuilt successfully.');
    } catch {
      setMessage('Failed to rebuild all embeddings.');
    } finally {
      setRebuildingAll(false);
    }
  };

  const filtered = docs.filter(d => d.filename.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="documents-page fade-in">
      <div className="docs-header">
        <div>
          <h1 className="page-title">My Documents</h1>
          <p className="page-subtitle">{docs.length} research paper(s) indexed</p>
        </div>
        <button
          id="rebuild-all-btn"
          className="btn-secondary rebuild-all-btn"
          onClick={handleRebuildAll}
          disabled={rebuildingAll || docs.length === 0}
        >
          {rebuildingAll ? 'Rebuilding All...' : 'Rebuild All Embeddings'}
        </button>
      </div>

      {message && (
        <div className={`docs-message ${message.includes('Failed') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="docs-search-wrap">
        <input
          id="docs-search-input"
          type="text"
          className="docs-search"
          placeholder="Search documents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <Loader message="Loading documents..." />
      ) : filtered.length === 0 ? (
        <div className="docs-empty">
          <div className="docs-empty-icon"></div>
          <h3>No Documents Found</h3>
          <p>{docs.length === 0 ? 'Upload your first research paper to get started.' : 'No documents match your search.'}</p>
        </div>
      ) : (
        <div className="docs-grid">
          {filtered.map(doc => (
            <DocumentCard
              key={doc._id}
              doc={doc}
              onDelete={handleDelete}
              onRebuild={handleRebuild}
              isDeleting={deletingId === doc._id}
              isRebuilding={rebuildingId === doc._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
