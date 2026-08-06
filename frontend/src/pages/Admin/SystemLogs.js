import React, { useEffect, useState } from 'react';
import { getSystemLogs } from '../../api/api';
import './SystemLogs.css';

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      const res = await getSystemLogs();
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      setError('Failed to retrieve system audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Extract unique actions
  const uniqueActions = ['ALL', ...new Set(logs.map(log => log.action))];

  const filteredLogs = logs.filter((log) => {
    // 1. Text filter
    const textQuery = filterQuery.toLowerCase();
    const matchesText =
      log.details.toLowerCase().includes(textQuery) ||
      log.actorName.toLowerCase().includes(textQuery) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(textQuery));

    // 2. Action filter
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesText && matchesAction;
  });

  return (
    <div className="system-logs-container fade-in">
      <div className="logs-header">
        <div>
          <h1>Security Audit Logs</h1>
          <p className="subtitle">Real-time log of administrative and clinical security events</p>
        </div>
        <div className="filters-row">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="action-select-filter"
          >
            {uniqueActions.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search by details, actor, IP address..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="search-logs-input"
          />
          <button onClick={fetchLogs} className="btn-secondary refresh-btn">
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="logs-alert error">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">Retrieving system security logs...</div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="empty-state glass">
          <p>No audit log records match the search parameters.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="audit-logs-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operation</th>
                <th>Details</th>
                <th>Actor</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log._id}>
                  <td>
                    <div className="date-time-cell">
                      <span className="cell-date">
                        {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
                      </span>
                      <span className="cell-time text-dim">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`action-badge ${log.action.toLowerCase()}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="cell-details">{log.details}</td>
                  <td>
                    <div className="actor-cell-info">
                      <span className="actor-cell-name">{log.actorName}</span>
                      <span className="actor-cell-role text-dim">{log.actorRole}</span>
                    </div>
                  </td>
                  <td>
                    <span className="table-mono text-dim">{log.ipAddress || 'System'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
