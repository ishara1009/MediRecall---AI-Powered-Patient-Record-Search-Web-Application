import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, logSearchQuery } from '../../api/api';
import './PatientRecordSearch.css';

export default function PatientRecordSearch() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [searchWord, setSearchWord] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [error, setError] = useState('');

  const loadDocuments = async () => {
    try {
      const res = await getDocuments();
      if (res.success) {
        setDocuments(res.data || []);
        setFilteredDocuments(res.data || []);
      }
    } catch (err) {
      setError('Failed to fetch patient records from DB.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const queryTerm = searchWord.trim();
    setActiveQuery(queryTerm);

    if (!queryTerm) {
      setFilteredDocuments(documents);
      return;
    }

    // Filter results locally
    const filtered = documents.filter((doc) =>
      doc.filename.toLowerCase().includes(queryTerm.toLowerCase())
    );
    setFilteredDocuments(filtered);

    // Call API to persist this search in DB logs 
    try {
      await logSearchQuery(queryTerm, filtered.length);
    } catch (err) {
      console.error('Failed to log search query to audit system:', err.message);
    }
  };

  const handleClearSearch = () => {
    setSearchWord('');
    setActiveQuery('');
    setFilteredDocuments(documents);
  };

  const handleSelectDocument = (event, doc) => {
    event.stopPropagation();
    setSelectedDoc(doc);
  };

  const openSelectedChat = () => {
    navigate('/doctor/chat', {
      state: { documentId: selectedDoc.customId, filename: selectedDoc.filename }
    });
  };

  return (
    <div className="record-search-container fade-in">
      <div className="search-header">
        <div>
          <h1>Patient Record Search</h1>
          <p className="subtitle">Retrieve medical charts, treatment summaries, and lab index records</p>
        </div>
      </div>

      {error && <div className="search-alert error">{error}</div>}

      <form onSubmit={handleSearchSubmit} className="search-bar-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search matching files (e.g. Patient ID, chart name...)"
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            className="search-main-input"
          />
          {searchWord && (
            <button type="button" onClick={handleClearSearch} className="clear-search-btn">
              Clear
            </button>
          )}
        </div>
        <button type="submit" className="btn-primary search-submit-btn">
          Perform Search
        </button>
      </form>

      {activeQuery && (
        <div className="search-results-indicator">
          Showing {filteredDocuments.length} results for: <strong>"{activeQuery}"</strong>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">Retrieving patient records...</div>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="empty-results-box glass">
          <h3>No Records Found</h3>
          <p>We couldn't find any medical records matching your search terms.</p>
        </div>
      ) : (
        <div className="records-grid-layout">
          {filteredDocuments.map((doc) => (
            <div
              key={doc._id}
              className={`record-card glass glass-interactive ${selectedDoc?._id === doc._id ? 'record-card-selected' : ''}`}
              onClick={() => setSelectedDoc(doc)}
            >
              <div className="card-top-row">
                <span className="file-ext">PDF</span>
              </div>
              <h3 className="record-filename">{doc.filename}</h3>
              <div className="record-meta-indicators">
                <span className="record-ind">
                  <strong>Uploaded:</strong> {new Date(doc.uploadDate).toLocaleDateString()}
                </span>
                {doc.fileSize && (
                  <span className="record-ind">
                    <strong>Size:</strong> {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
              </div>
              <button
                type="button"
                className="select-record-btn"
                onClick={(event) => handleSelectDocument(event, doc)}
              >
                {selectedDoc?._id === doc._id ? 'Selected PDF' : 'Select PDF'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Record details details popup modal */}
      {selectedDoc && (
        <div className="modal-backdrop" onClick={() => setSelectedDoc(null)}>
          <div className="modal-window glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Medical Document Profile</h2>
              <button onClick={() => setSelectedDoc(null)} className="modal-close-cross">
                Close
              </button>
            </div>
            
            <div className="modal-document-details">
              <div className="detail-entry">
                <span className="detail-label">File Name</span>
                <span className="detail-value value-highlight">{selectedDoc.filename}</span>
              </div>

              <div className="detail-entry">
                <span className="detail-label">MongoDB Object ID</span>
                <span className="detail-value table-mono">{selectedDoc._id}</span>
              </div>

              <div className="detail-row flex">
                <div className="detail-entry flex-1">
                  <span className="detail-label">Index Date</span>
                  <span className="detail-value">
                    {new Date(selectedDoc.uploadDate).toLocaleString()}
                  </span>
                </div>
                <div className="detail-entry flex-1">
                  <span className="detail-label">Memory Footprint</span>
                  <span className="detail-value">
                    {selectedDoc.fileSize ? `${(selectedDoc.fileSize / 1024 / 1024).toFixed(3)} MB` : 'N/A'}
                  </span>
                </div>
              </div>

              {selectedDoc.description && (
                <div className="detail-entry font-alt">
                  <span className="detail-label">Record Summary</span>
                  <p className="detail-desc-paragraph">{selectedDoc.description}</p>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={openSelectedChat} className="btn-primary">
                AI Chat with This PDF
              </button>
              <button onClick={() => setSelectedDoc(null)} className="btn-primary">
                Close Record Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
