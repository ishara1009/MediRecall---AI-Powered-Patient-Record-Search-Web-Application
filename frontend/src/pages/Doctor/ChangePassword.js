import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../../api/api';
import { AuthContext } from '../../context/AuthContext';
import './ChangePassword.css';

export default function ChangePassword() {
  const { user, syncProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long';
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one numeric digit';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password must contain at least one special character';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { currentPassword, newPassword, confirmNewPassword } = formData;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      setLoading(false);
      return;
    }

    const strengthError = validatePassword(newPassword);
    if (strengthError) {
      setError(strengthError);
      setLoading(false);
      return;
    }

    try {
      const res = await changePassword(currentPassword, newPassword, confirmNewPassword);

      if (res.success) {
        setSuccess('Password updated successfully! Granting session access...');
        
        // Sync first login setting on state
        if (user) {
          syncProfile({ ...user, isFirstLogin: false });
        }

        setTimeout(() => {
          if (user && user.role === 'Admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/doctor/dashboard');
          }
        }, 2000);
      } else {
        setError(res.message || 'Failed to change password. Please check your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during password change.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-pwd-container fade-in">
      <div className="change-pwd-card glass">
        <div className="change-pwd-header">
          <h2>Update Password</h2>
          {user?.isFirstLogin ? (
            <p className="hint-first-login">
              You are logging in with a <strong>temporary password</strong>. You must change your password to secure your account before getting dashboard permissions.
            </p>
          ) : (
            <p className="hint-first-login">
              Change your active account login password.
            </p>
          )}
        </div>

        {error && <div className="change-pwd-alert error">{error}</div>}
        {success && <div className="change-pwd-alert success">{success}</div>}

        <form onSubmit={handleSubmit} className="change-pwd-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current/Temporary Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              required
            />
            <span className="field-hint">Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol</span>
          </div>

          <div className="form-group">
            <label htmlFor="confirmNewPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmNewPassword"
              name="confirmNewPassword"
              value={formData.confirmNewPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-primary change-pwd-btn" disabled={loading}>
            {loading ? 'Processing Change...' : 'Update Password & Access Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
