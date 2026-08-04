import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/upload', label: 'Upload' },
  { path: '/documents', label: 'Documents' },
  { path: '/chat', label: 'Chat' },
  { path: '/about', label: 'About' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-text">Advance <span className="brand-accent">RAG</span></span>
      </div>
      <div className="navbar-links">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            id={`nav-${link.label.toLowerCase()}`}
            className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
          >
            <span className="nav-label">{link.label}</span>
          </Link>
        ))}
      </div>
      <div className="navbar-badge">
        <span className="badge-dot"></span>
        <span className="badge-text">AI Powered</span>
      </div>
    </nav>
  );
}
