import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      await logout();
      navigate('/login');
    } finally {
      setIsSigningOut(false);
      setShowLogoutDialog(false);
    }
  };

  useEffect(() => {
    if (!showLogoutDialog) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSigningOut) {
        setShowLogoutDialog(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showLogoutDialog, isSigningOut]);

  // Auth pages — show minimal navbar
  const authPages = ['/login', '/forgot-password', '/setup'];
  const isAuthPage = authPages.includes(location.pathname);

  // Build nav links based on role
  const getNavLinks = () => {
    if (!isAuthenticated || !user) return [];

    if (user.role === 'Admin') {
      return [
        { path: '/admin/dashboard', label: 'Dashboard' },
        { path: '/admin/doctors', label: 'Physicians' },
        { path: '/admin/patients', label: 'Records' },
        { path: '/admin/upload', label: 'Upload PDF' },
        { path: '/admin/logs', label: 'Audit Logs' },
      ];
    }

    if (user.role === 'Doctor') {
      return [
        { path: '/doctor/dashboard', label: 'Dashboard' },
        { path: '/doctor/search', label: 'Search Records' },
        { path: '/doctor/chat', label: 'AI Consult' },
      ];
    }

    return [];
  };

  const navLinks = getNavLinks();
  const profilePath = user?.role === 'Admin' ? '/admin/profile' : '/doctor/profile';

  return (
    <nav className="navbar">
      {/* Brand */}
      <div className="navbar-brand">
        <Link to={isAuthenticated ? (user?.role === 'Admin' ? '/admin/dashboard' : '/doctor/dashboard') : '/login'} className="brand-link">
          <span className="brand-text">Medi<span className="brand-accent">Recall</span></span>
        </Link>
        {user && (
          <span className="role-badge role-badge--inline">{user.role}</span>
        )}
      </div>

      {/* Navigation links (hidden on auth pages) */}
      {!isAuthPage && isAuthenticated && (
        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              id={`nav-${link.label.toLowerCase().replace(/\s/g, '-')}`}
              className={`nav-link ${location.pathname.startsWith(link.path) ? 'active' : ''}`}
            >
              <span className="nav-label">{link.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Right side */}
      <div className="navbar-right">
        {isAuthenticated && user ? (
          <div className="user-menu">
            <Link to={profilePath} className="user-avatar-btn" title="My Profile">
              {user.profilePicture ? (
                <img
                  src={`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}${user.profilePicture}`}
                  alt={user.fullName}
                  className="avatar-img-sm"
                />
              ) : (
                <div className="avatar-initials-sm">
                  {user.fullName?.substring(0, 2).toUpperCase() || 'U'}
                </div>
              )}
            </Link>
            <div className="user-info-snippet">
              <span className="user-name-nav">{user.fullName?.split(' ')[0]}</span>
            </div>
            <button className="logout-btn" onClick={() => setShowLogoutDialog(true)} title="Sign Out">
              Sign Out
            </button>
          </div>
        ) : (
          !isAuthPage && (
            <Link to="/login" className="nav-login-btn btn-primary">
              Sign In
            </Link>
          )
        )}
      </div>

      {showLogoutDialog && (
        <div
          className="logout-dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSigningOut) {
              setShowLogoutDialog(false);
            }
          }}
        >
          <div
            className="logout-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-message"
          >
            <p className="logout-dialog-label">Session confirmation</p>
            <h2 id="logout-dialog-title">Sign out of MediRecall?</h2>
            <p id="logout-dialog-message">
              You will need to enter your credentials again to access your workspace.
            </p>
            <div className="logout-dialog-actions">
              <button
                type="button"
                className="logout-cancel-btn"
                onClick={() => setShowLogoutDialog(false)}
                disabled={isSigningOut}
                autoFocus
              >
                Cancel
              </button>
              <button
                type="button"
                className="logout-confirm-btn"
                onClick={handleLogout}
                disabled={isSigningOut}
              >
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
