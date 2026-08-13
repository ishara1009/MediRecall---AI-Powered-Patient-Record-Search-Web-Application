import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats, getSystemLogs } from '../../api/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    doctors: { total: 0, active: 0, inactive: 0 },
    patientRecordsCount: 0,
    totalChats: 0,
    logEntriesCount: 0
  });

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await getAdminStats();
      if (statsRes.success) setStats(statsRes.data);

      const logsRes = await getSystemLogs();
      if (logsRes.success) setLogs(logsRes.data.slice(0, 5)); // recent 5 logs

    } catch (err) {
      console.error('Failed to load dashboard metrics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="loading-spinner">Loading administrator metrics...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard fade-in">
      <div className="dashboard-header">
        <div>
          <h1>Administration Portal</h1>
          <p className="welcome-sub">System monitoring, audit logs, and account registration</p>
        </div>
        <div className="badge-wrapper">
          <span className="secure-badge">
            HIPAA Secure Workspace
          </span>
        </div>
      </div>

      {/* Grid of stats */}
      <div className="stats-grid">
        <div className="summary-card glass">
          <div className="card-top">
            <span className="card-number">{stats.doctors.total}</span>
            <span className="card-lbl">Physicians</span>
          </div>
          <div className="card-bottom">
            <span className="sub-lbl active-docs">{stats.doctors.active} Active</span>
            <span className="sub-lbl inactive-docs">{stats.doctors.inactive} Deactivated</span>
          </div>
        </div>

        <div className="summary-card glass">
          <div className="card-top">
            <span className="card-number">{stats.patientRecordsCount}</span>
            <span className="card-lbl">Records Indexed</span>
          </div>
          <div className="card-bottom font-alt">
            <Link to="/admin/patients" className="dashboard-shortcut-link">
              Manage Records
            </Link>
          </div>
        </div>

        <div className="summary-card glass">
          <div className="card-top">
            <span className="card-number">{stats.totalChats}</span>
            <span className="card-lbl">AI Conversions</span>
          </div>
          <div className="card-bottom">
            <span className="sub-lbl">GPT-4o & Chroma QA thread logs</span>
          </div>
        </div>

        <div className="summary-card glass">
          <div className="card-top">
            <span className="card-number">{stats.logEntriesCount}</span>
            <span className="card-lbl">Audit Trails</span>
          </div>
          <div className="card-bottom font-alt">
            <Link to="/admin/logs" className="dashboard-shortcut-link">
              View Logs
            </Link>
          </div>
        </div>
      </div>

      <div className="dashboard-layout-row">
        {/* Quick Operations panel */}
        <section className="dashboard-panel quick-ops-panel glass">
          <h3>Quick Operations</h3>
          <div className="ops-grid">
            <Link to="/admin/create-doctor" className="ops-btn glass-interactive">
              <span className="ops-title">Create Doctor</span>
              <span className="ops-desc">Register a new physician account</span>
            </Link>

            <Link to="/admin/doctors" className="ops-btn glass-interactive">
              <span className="ops-title">Manage Physicians</span>
              <span className="ops-desc">Update, deactivate, or delete doctors</span>
            </Link>

            <Link to="/admin/upload" className="ops-btn glass-interactive">
              <span className="ops-title">Ingest Records</span>
              <span className="ops-desc">Upload patient charts PDF/files</span>
            </Link>

            <Link to="/admin/logs" className="ops-btn glass-interactive">
              <span className="ops-title">Audit Trails</span>
              <span className="ops-desc">Log database access events</span>
            </Link>
          </div>
        </section>

        {/* System Logs preview panel */}
        <section className="dashboard-panel logs-panel glass">
          <div className="panel-header">
            <h3>Recent Audit Events</h3>
            <Link to="/admin/logs" className="see-all-link">See All</Link>
          </div>
          <div className="logs-preview-list">
            {logs.length === 0 ? (
              <div className="empty-state-text">No recent audit logs available.</div>
            ) : (
              logs.map((log) => (
                <div key={log._id} className="log-preview-item">
                  <div className="log-meta">
                    <span className="log-action-badge">{log.action}</span>
                    <span className="log-time">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="log-text">{log.details}</p>
                  <span className="log-actor text-dim">
                    By {log.actorName} ({log.actorRole})
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
