import React, { useEffect, useState } from 'react';
import { getDocuments, deleteDocument, rebuildDocument, rebuildAllDocuments, updateDocumentPatient } from '../../api/api';
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
  const [editingDoc, setEditingDoc] = useState(null);
  const [editPatient, setEditPatient] = useState({ name: '', id: '', diseases: '', photo: null, pdf: null });
  const [savingEdit, setSavingEdit] = useState(false);

  const openEdit = (doc) => {
    setEditingDoc(doc);
    setEditPatient({ name: doc.patientName || '', id: doc.patientId || '', diseases: (doc.diseases || []).join(', '), photo: null, pdf: null });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await updateDocumentPatient(editingDoc._id, editPatient);
      setDocs(prev => prev.map(doc => doc._id === editingDoc._id ? res.data : doc));
      setEditingDoc(null);
      setMessage('Patient information updated successfully.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update patient information.');
    } finally {
      setSavingEdit(false);
    }
  };

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

  const filtered = docs.filter(d => [d.filename, d.patientName, d.patientId, ...(d.diseases || [])]
    .some(value => value?.toLowerCase().includes(search.toLowerCase())));

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
          placeholder="Search by patient, ID, disease, or document..."
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
              onEdit={openEdit}
              isDeleting={deletingId === doc._id}
              isRebuilding={rebuildingId === doc._id}
            />
          ))}
        </div>
      )}

      {editingDoc && (
        <div className="modal-backdrop" onClick={() => setEditingDoc(null)}>
          <form className="patient-edit-modal glass" onSubmit={saveEdit} onClick={(e) => e.stopPropagation()}>
            <div className="patient-edit-header">
              <h2>Edit Patient Information</h2>
              <button type="button" onClick={() => setEditingDoc(null)}>Close</button>
            </div>
            <label className="edit-photo-picker">
              {(editPatient.photo || editingDoc.patientPhoto) ? (
                <img src={editPatient.photo ? URL.createObjectURL(editPatient.photo) : `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/uploads/${editingDoc.patientPhoto}`} alt="Patient" />
              ) : <span>Add Photo</span>}
              <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => setEditPatient(prev => ({ ...prev, photo: e.target.files?.[0] || null }))} />
            </label>
            <label>Patient Name<input value={editPatient.name} onChange={(e) => setEditPatient(prev => ({ ...prev, name: e.target.value }))} required /></label>
            <label>Patient ID<input value={editPatient.id} onChange={(e) => setEditPatient(prev => ({ ...prev, id: e.target.value }))} required /></label>
            <label>Diseases / Conditions<input value={editPatient.diseases} onChange={(e) => setEditPatient(prev => ({ ...prev, diseases: e.target.value }))} placeholder="Comma-separated conditions" required /></label>
            <label className="replace-pdf-field">
              Replace PDF (optional)
              <input type="file" accept="application/pdf" onChange={(e) => setEditPatient(prev => ({ ...prev, pdf: e.target.files?.[0] || null }))} />
              <small>{editPatient.pdf ? `New file: ${editPatient.pdf.name}` : `Current file: ${editingDoc.filename}`}</small>
            </label>
            <div className="patient-edit-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditingDoc(null)}>Cancel</button>
              <button className="btn-primary" disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
