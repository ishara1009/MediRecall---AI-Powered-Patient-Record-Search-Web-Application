import React, { useEffect } from 'react';
import './UI.css';
import './AvailabilityStatus.css';

export function PageHeader({ eyebrow, title, description, action }) {
  return <header className="ui-page-header"><div>{eyebrow && <span className="ui-eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="ui-page-action">{action}</div>}</header>;
}

export function StatusBadge({ status }) {
  const statusClass = String(status || '').toLowerCase().trim().replace(/\s+/g, '-');
  return <span className={`ui-status ui-status--${statusClass}`}><span aria-hidden="true" />{status}</span>;
}

export function EmptyState({ title, message, action, symbol = '+' }) {
  return <div className="ui-empty"><span className="ui-empty-symbol" aria-hidden="true">{symbol}</span><h3>{title}</h3><p>{message}</p>{action}</div>;
}

export function Skeleton({ cards = 3 }) {
  return <div className="ui-skeleton-grid" aria-label="Loading content">{Array.from({ length: cards }, (_, index) => <div className="ui-skeleton-card" key={index}><i /><b /><b /><b className="short" /></div>)}</div>;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onClose, busy = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (event.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open, busy, onClose]);
  if (!open) return null;
  return <div className="ui-dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}><div className="ui-dialog" role="alertdialog" aria-modal="true" aria-labelledby="ui-confirm-title"><span className="ui-dialog-icon">!</span><h2 id="ui-confirm-title">{title}</h2><p>{message}</p><div><button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>{cancelLabel}</button><button type="button" className="ui-danger-btn" onClick={onConfirm} disabled={busy}>{busy ? 'Please wait...' : confirmLabel}</button></div></div></div>;
}
