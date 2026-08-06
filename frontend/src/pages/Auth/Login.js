import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Login.css';

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" x2="22" y1="2" y2="22"/>
  </svg>
);

const AlertCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" x2="12" y1="8" y2="12"/>
    <line x1="12" x2="12.01" y1="16" y2="16"/>
  </svg>
);

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const result = await login(email.trim(), password);

      if (result.success && result.user) {
        const { role, isFirstLogin } = result.user;

        if (role === 'Admin') {
          navigate('/admin/dashboard');
        } else if (role === 'Doctor') {
          if (isFirstLogin) {
            navigate('/doctor/change-password');
          } else {
            navigate('/doctor/dashboard');
          }
        }
      } else {
        setError(result.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrap fade-in">

        {/* Brand */}
        <div className="login-brand">
          <div className="login-logo-mark">
            <svg viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="9" fill="#6366f1"/>
              <path d="M18 9v18M9 18h18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="18" cy="18" r="3.5" fill="white"/>
            </svg>
          </div>
          <span className="login-logo-text">Medi<span className="login-logo-accent">Recall</span></span>
        </div>

        {/* Card */}
        <div className="login-card">
          <div className="login-card-header">
            <h1>Sign in to your account</h1>
            <p>Enter your credentials to access the clinical portal</p>
          </div>

          {error && (
            <div className="login-alert">
              <span className="login-alert-icon"><AlertCircleIcon /></span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="form-field">
              <label htmlFor="email">Email address</label>
              <div className="field-input-wrap">
                <span className="field-icon"><MailIcon /></span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="physician@hospital.org"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <div className="field-label-row">
                <label htmlFor="password">Password</label>
                <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
              </div>
              <div className="field-input-wrap">
                <span className="field-icon"><LockIcon /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <span className="login-btn-loading">
                  <span className="login-spinner" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="login-divider" />

          <div className="login-secure-note">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1zm3 8V5.5a3 3 0 1 0-6 0V9h6z" clipRule="evenodd"/>
            </svg>
            Protected by TLS 1.3 &mdash; end-to-end encrypted session
          </div>
        </div>

        <p className="login-footer">© 2026 MediRecall. All rights reserved.</p>
      </div>
    </div>
  );
}
