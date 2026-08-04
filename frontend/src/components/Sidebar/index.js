import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const sidebarItems = [
  { path: '/', label: 'Home' },
  { path: '/upload', label: 'Upload Papers' },
  { path: '/documents', label: 'My Documents' },
  { path: '/chat', label: 'AI Chat' },
  { path: '/about', label: 'About' },
];

export default function Sidebar() {
  const location = useLocation();
  // Only show sidebar on /chat page
  if (location.pathname !== '/chat') return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Navigation</span>
      </div>
      <nav className="sidebar-nav">
        {sidebarItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            id={`sidebar-${item.label.toLowerCase().replace(' ', '-')}`}
            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
