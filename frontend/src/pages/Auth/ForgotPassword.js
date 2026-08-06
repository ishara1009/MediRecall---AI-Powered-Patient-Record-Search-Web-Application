import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword } from '../../api/api';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [role, setRole] = useState('Doctor'); // Default to Doctor
  const [formData, setFormData] = useState({
    email: '',
    employeeId: '',
    phoneNumber: '',
    medicalLicenseNumber: '',
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
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password must contain at least one special character';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { email, employeeId, phoneNumber, medicalLicenseNumber, newPassword, confirmNewPassword } = formData;

    // Direct input check
    if (!email || !employeeId || !phoneNumber || !newPassword || !confirmNewPassword) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    if (role === 'Doctor' && !medicalLicenseNumber) {
      setError('Medical license number is required for doctors.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      setLoading(false);
      return;
    }

    const pwdStrengthError = validatePassword(newPassword);
    if (pwdStrengthError) {
      setError(pwdStrengthError);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: email.trim(),
        employeeId: employeeId.trim(),
        phoneNumber: phoneNumber.trim(),
        newPassword,
        confirmNewPassword
      };

      if (role === 'Doctor') {
        payload.medicalLicenseNumber = medicalLicenseNumber.trim();
      }

      const res = await forgotPassword(payload);

      if (res.success) {
        setSuccess('Identity verified! Password has been reset successfully. Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2200);
      } else {
        setError(res.message || 'Verification and password reset failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container fade-in">
      <div className="forgot-card glass">
        <div className="forgot-header">
          <div className="forgot-logo">
            <span className="logo-brand">Medi<span className="logo-accent">Recall</span></span>
          </div>
          <h1>Reset Password</h1>
          <p className="forgot-subtitle">
            Verify your official clinical credentials to authorize a new password creation
          </p>
        </div>

        {error && <div className="forgot-alert error">{error}</div>}
        {success && <div className="forgot-alert success">{success}</div>}

        <form onSubmit={handleSubmit} className="forgot-form">
          {/* Role selector tab */}
          <div className="role-tab-group">
            <button
              type="button"
              className={`role-tab ${role === 'Doctor' ? 'active' : ''}`}
              onClick={() => { setRole('Doctor'); setError(''); }}
            >
              Doctor
            </button>
            <button
              type="button"
              className={`role-tab ${role === 'Admin' ? 'active' : ''}`}
              onClick={() => { setRole('Admin'); setError(''); }}
            >
              Admin
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="email">Registered Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g. physician@hospital.org"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="employeeId">Employee ID</label>
              <input
                type="text"
                id="employeeId"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                placeholder="e.g. DR-4439"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Registered Phone Number</label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="e.g. +1 555-0199"
                required
              />
            </div>

            {role === 'Doctor' && (
              <div className="form-group">
                <label htmlFor="medicalLicenseNumber">Medical License Number</label>
                <input
                  type="text"
                  id="medicalLicenseNumber"
                  name="medicalLicenseNumber"
                  value={formData.medicalLicenseNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. LIC-40918-B"
                  required={role === 'Doctor'}
                />
              </div>
            )}

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
          </div>

          <div className="action-row">
            <Link to="/login" className="back-to-login">
              Back to Login
            </Link>
            <button type="submit" className="btn-primary forgot-submit-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
