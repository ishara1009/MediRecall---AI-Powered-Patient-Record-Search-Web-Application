import React, { useState, useRef } from 'react';
import { uploadDocuments } from '../../api/api';
import './Upload.css';

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [patient, setPatient] = useState({ name: '', id: '', diseases: '', photo: null });
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const addFiles = (newFiles) => {
    const pdfs = Array.from(newFiles).filter(f => f.type === 'application/pdf');
    if (pdfs.length === 0) {
      setError('Please select PDF files only.');
      return;
    }
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...pdfs.filter(f => !existing.has(f.name))];
    });
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!files.length || !patient.name.trim() || !patient.id.trim() || !patient.diseases.trim()) {
      setError('Patient name, ID, diseases, and at least one PDF are required.');
      return;
    }
    setUploading(true);
    setProgress(0);
    setResult(null);
    setError('');
    try {
      const res = await uploadDocuments(files, patient, (evt) => {
        if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
      });
      setResult(res);
      setFiles([]);
      setPatient({ name: '', id: '', diseases: '', photo: null });
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Is the backend running?');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (name) => setFiles(prev => prev.filter(f => f.name !== name));

  return (
    <div className="upload-page fade-in">
      <div className="page-header">
        <h1 className="page-title">Upload Patient Records</h1>
        <p className="page-subtitle">Add patient details and upload one or more PDF medical records for AI-powered question answering.</p>
      </div>

      <section className="patient-upload-form glass">
        <div className="patient-photo-field">
          <button type="button" className="patient-photo-picker" onClick={() => photoInputRef.current?.click()}>
            {patient.photo ? (
              <img src={URL.createObjectURL(patient.photo)} alt="Patient preview" />
            ) : (
              <span>Add Patient Photo</span>
            )}
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => setPatient(prev => ({ ...prev, photo: e.target.files?.[0] || null }))}
          />
          <small>JPG, PNG or WebP</small>
        </div>
        <div className="patient-fields">
          <label>
            <span>Patient Name</span>
            <input value={patient.name} onChange={(e) => setPatient(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Nimal Perera" />
          </label>
          <label>
            <span>Patient ID</span>
            <input value={patient.id} onChange={(e) => setPatient(prev => ({ ...prev, id: e.target.value }))} placeholder="e.g. PAT-0001" />
          </label>
          <label className="diseases-field">
            <span>Diseases / Conditions</span>
            <input value={patient.diseases} onChange={(e) => setPatient(prev => ({ ...prev, diseases: e.target.value }))} placeholder="e.g. Diabetes, Hypertension" />
          </label>
        </div>
      </section>

      {/* Drop Zone */}
      <div
        className={`drop-zone glass ${isDragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        id="pdf-drop-zone"
      >
        <p className="drop-text">Drag & drop PDF files here, or click to select</p>
        <p className="drop-hint">Supports multiple files · Max 50MB per file</p>
        <input
          ref={fileInputRef}
          type="file"
          id="pdf-file-input"
          multiple
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="file-list glass">
          <div className="file-list-header">
            <span className="file-count">{files.length} file(s) selected</span>
            <button className="clear-btn" onClick={() => setFiles([])}>Clear All</button>
          </div>
          {files.map(f => (
            <div key={f.name} className="file-item">
              <span className="file-name">{f.name}</span>
              <span className="file-size">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
              <button className="file-remove-btn" onClick={() => removeFile(f.name)}>Remove</button>
            </div>
          ))}
          {uploading && (
            <div className="progress-bar-wrap">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              <span className="progress-text">{progress}%</span>
            </div>
          )}
          <button
            id="upload-submit-btn"
            className="btn-primary upload-btn"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? `Uploading... ${progress}%` : 'Upload & Index'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && <div className="upload-error">{error}</div>}

      {/* Result */}
      {result && (
        <div className="upload-result glass">
          <h3 className="result-title">Upload Complete</h3>
          <p className="result-msg">{result.message}</p>
          {result.data?.uploaded?.map(doc => (
            <div key={doc._id} className="result-item">
              <span>{doc.filename}</span>
              <span className="result-pages">{doc.totalPages} pages indexed</span>
            </div>
          ))}
          {result.data?.failed?.length > 0 && (
            <div className="result-failed">
              <p>Failed:</p>
              {result.data.failed.map((f, i) => (
                <p key={i} className="failed-item">{f.filename}: {f.error}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
