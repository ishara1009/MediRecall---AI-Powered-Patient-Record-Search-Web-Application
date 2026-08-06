import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDoctorStats } from '../../api/api';
import './DoctorDashboard.css';

export default function DoctorDashboard() {
  const [stats, setStats] = useState({
    sessionsCount: 0,
    searchesCount: 0,
    documentsCount: 0,
    recentQueries: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await getDoctorStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to retrieve physician dashboard metrics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="doc-dashboard-loading">
        <div className="loading-spinner">Loading clinical workspace...</div>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard fade-in">
      <div className="dashboard-header">
        <div>
          <h1>Clinical Decision Workspace</h1>
          <p className="welcome-sub">Consult medical records, search charts and converse with clinical AI assistant</p>
        </div>
        <div className="badge-wrapper">
          <span className="hipaa-compliance-badge">
            ⚡ HIPAA Verified Session
          </span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="summary-card glass">
          <div className="card-top">
            <span className="card-number">{stats.documentsCount}</span>
            <span className="card-lbl">Patient Charts Ingested</span>
          </div>
          <div className="card-bottom">
            <Link to="/doctor/search" className="dashboard-link">
              Search Patient Records →
            </Link>
          </div>
        </div>

        <div className="summary-card glass">
          <div className="card-top">
            <span className="card-number">{stats.sessionsCount}</span>
            <span className="card-lbl">Chat Consultations</span>
          </div>
          <div className="card-bottom">
            <Link to="/doctor/chat" className="dashboard-link">
              consult AI chatbot →
            </Link>
          </div>
        </div>

        <div className="summary-card glass">
          <div className="card-top">
            <span className="card-number">{stats.searchesCount}</span>
            <span className="card-lbl">Search Queries Performed</span>
          </div>
          <div className="card-bottom">
            <Link to="/doctor/search-history" className="dashboard-link">
              View Logs History →
            </Link>
          </div>
        </div>
      </div>

      <div className="dashboard-row-layout">
        {/* Clinician Quick Tasks */}
        <section className="dashboard-panel quick-tasks glass">
          <h3>Quick Consultation Tasks</h3>
          <div className="tasks-grid">
            <Link to="/doctor/search" className="task-tile glass-interactive">
              <span className="tile-icon">🔎</span>
              <span className="tile-title">Patient Records Search</span>
              <span className="tile-desc">Search documents metadata, view summary details</span>
            </Link>

            <Link to="/doctor/chat" className="task-tile glass-interactive">
              <span className="tile-icon">💬</span>
              <span className="tile-title">AI Chat Assistant</span>
              <span className="tile-desc">Query information using RAG chatbot</span>
            </Link>

            <Link to="/doctor/search-history" className="task-tile glass-interactive">
              <span className="tile-icon">📜</span>
              <span className="tile-title">Consultation Search Log</span>
              <span className="tile-desc">View previous search log criteria</span>
            </Link>

            <Link to="/doctor/profile" className="task-tile glass-interactive">
              <span className="tile-icon">⚙️</span>
              <span className="tile-title">Account Settings</span>
              <span className="tile-desc">View details, modify profile picture, update passwords</span>
            </Link>
          </div>
        </section>

        {/* Doctor Recent Searches preview */}
        <section className="dashboard-panel searches-panel glass">
          <h3>Your Recent Search Logs</h3>
          <div className="searches-preview-list">
            {stats.recentQueries.length === 0 ? (
              <div className="empty-searches">No search logs registered in this account.</div>
            ) : (
              stats.recentQueries.map((log) => (
                <div key={log._id} className="search-preview-item">
                  <div className="search-preview-meta">
                    <span className="query-text">"{log.query}"</span>
                    <span className="query-results">{log.resultsCount} Record(s)</span>
                  </div>
                  <span className="query-time text-dim">
                    {new Date(log.timestamp).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
