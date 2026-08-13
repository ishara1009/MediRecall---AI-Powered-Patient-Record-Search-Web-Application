import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Login.css';

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
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="form-field">
              <label htmlFor="email">Email address</label>
              <div className="field-input-wrap">
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
                  {showPassword ? 'Hide' : 'Show'}
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
            Protected by TLS 1.3 &mdash; end-to-end encrypted session
          </div>
        </div>

        <p className="login-footer">© 2026 MediRecall. All rights reserved.</p>
      </div>
    </div>
  );
}
