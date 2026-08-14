import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../api/api';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

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

  useEffect(() => { setProfileOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!isAuthenticated) return;
    getNotifications().then((res) => { if (res.success) { setNotifications(res.data.notifications || []); setUnread(res.data.unread || 0); } }).catch(() => {});
  }, [isAuthenticated, location.pathname]);

  // Auth pages — show minimal navbar
  const authPages = ['/login', '/signup', '/forgot-password', '/setup'];
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
        { path: '/doctor/patients', label: 'Patients' },
        { path: '/doctor/appointments', label: 'Appointments' },
        { path: '/doctor/search', label: 'Search Records' },
        { path: '/doctor/chat', label: 'AI Consult' },
      ];
    }

    if (user.role === 'User') {
      return [
        { path: '/user/dashboard', label: 'Dashboard' },
        { path: '/user/appointments', label: 'Appointments' },
        { path: '/user/doctors', label: 'Doctors' }
      ];
    }

    return [];
  };

  const navLinks = getNavLinks();
  const profilePath = user?.role === 'Admin' ? '/admin/profile' : user?.role === 'Doctor' ? '/doctor/profile' : '/user/profile';
  const dashboardPath = user?.role === 'Admin' ? '/admin/dashboard' : user?.role === 'Doctor' ? '/doctor/dashboard' : '/user/dashboard';

  return (
    <nav className="navbar">
      {/* Brand */}
      <div className="navbar-brand">
        <Link to={isAuthenticated ? dashboardPath : '/login'} className="brand-link">
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
            <button type="button" className="notification-bell" aria-label={`${unread} unread notifications`} aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((open) => !open); setProfileOpen(false); }}>♢{unread > 0 && <span>{unread > 9 ? '9+' : unread}</span>}</button>
            {notificationsOpen && <div className="notification-dropdown"><header><strong>Notifications</strong>{unread > 0 && <button onClick={async () => { await markAllNotificationsRead(); setUnread(0); setNotifications((items) => items.map((item) => ({ ...item, isRead: true }))); }}>Mark all as read</button>}</header><div>{notifications.length ? notifications.slice(0, 8).map((item) => <button className={item.isRead ? '' : 'unread'} key={item._id} onClick={async () => { if (!item.isRead) { await markNotificationRead(item._id); setUnread((count) => Math.max(0, count - 1)); setNotifications((items) => items.map((entry) => entry._id === item._id ? { ...entry, isRead: true } : entry)); } }}><strong>{item.title}</strong><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString()}</small></button>) : <p className="notification-empty">No notifications.</p>}</div></div>}
            <button type="button" className="user-avatar-btn" title="Open profile menu" aria-haspopup="menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>
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
            </button>
            <div className="user-info-snippet">
              <span className="user-name-nav">{user.fullName?.split(' ')[0]}</span>
            </div>
            <button className="profile-chevron" aria-label="Toggle profile menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>⌄</button>
            {profileOpen && <div className="profile-dropdown" role="menu"><div className="profile-dropdown-head"><strong>{user.fullName}</strong><span>{user.email}</span></div><Link role="menuitem" to={profilePath}>My Profile</Link>{user.role === 'User' && <Link role="menuitem" to="/user/appointments">My Appointments</Link>}<Link role="menuitem" to={profilePath}>Settings</Link><button role="menuitem" onClick={() => { setProfileOpen(false); setShowLogoutDialog(true); }}>Sign Out</button></div>}
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
