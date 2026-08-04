import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDocuments, checkHealth } from '../../api/api';
import './Home.css';

export default function Home() {
  const [docs, setDocs] = useState([]);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    getDocuments().then(res => setDocs(res.data || [])).catch(() => {});
    checkHealth().then(res => setHealth(res.data)).catch(() => {});
  }, []);

  return (
    <div className="home-page fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">AI-Powered Research Assistant</div>
        <h1 className="hero-title">
          Explore Research Papers with
          <span className="gradient-text"> Advance RAG</span>
        </h1>
        <p className="hero-subtitle">
          Upload your research papers. Ask questions. Get precise, context-grounded answers with source citations and confidence scores — powered by OpenAI GPT and ChromaDB.
        </p>
        <div className="hero-actions">
          <Link to="/upload" id="hero-upload-btn" className="btn-primary hero-btn">
            Upload Papers
          </Link>
          <Link to="/chat" id="hero-chat-btn" className="btn-secondary hero-btn">
            Start Chatting
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stat-card glass">
          <div className="stat-number">{docs.length}</div>
          <div className="stat-label">Documents Indexed</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-number">GPT-4o</div>
          <div className="stat-label">Language Model</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-number">Chroma</div>
          <div className="stat-label">Vector Database</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-number">Top-5</div>
          <div className="stat-label">Context Retrieval</div>
        </div>
      </section>

      {/* Recent Documents */}
      {docs.length > 0 && (
        <section className="recent-section">
          <div className="section-header">
            <h2 className="section-title">Recent Documents</h2>
            <Link to="/documents" className="section-link">View All →</Link>
          </div>
          <div className="recent-list">
            {docs.slice(0, 4).map(doc => (
              <div key={doc._id} className="recent-item glass">
                <div className="recent-info">
                  <span className="recent-name">{doc.filename}</span>
                  <span className="recent-meta">{doc.totalPages} pages</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Health Status */}
      {health && (
        <section className="health-section">
          <div className="health-card glass">
            <h3 className="health-title">System Status</h3>
            <div className="health-items">
              {Object.entries(health.services || {}).map(([svc, info]) => (
                <div key={svc} className="health-item">
                  <span className={`health-dot ${info.status === 'healthy' ? 'green' : 'red'}`}></span>
                  <span className="health-svc">{svc}</span>
                  <span className={`health-status ${info.status === 'healthy' ? 'ok' : 'err'}`}>
                    {info.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
