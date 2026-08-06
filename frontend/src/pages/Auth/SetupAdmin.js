import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupAdmin } from '../../api/api';
import { AuthContext } from '../../context/AuthContext';
import './SetupAdmin.css';

export default function SetupAdmin() {
  const { checkSetupStatus } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    employeeId: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
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

    const { fullName, employeeId, email, phoneNumber, password, confirmPassword } = formData;

    // Client-side validations
    if (!fullName || !employeeId || !email || !phoneNumber || !password || !confirmPassword) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    const pwdStrengthError = validatePassword(password);
    if (pwdStrengthError) {
      setError(pwdStrengthError);
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append('fullName', fullName.trim());
      data.append('employeeId', employeeId.trim());
      data.append('email', email.trim());
      data.append('phoneNumber', phoneNumber.trim());
      data.append('password', password);
      data.append('confirmPassword', confirmPassword);
      if (profilePicture) {
        data.append('profilePicture', profilePicture);
      }

      const res = await setupAdmin(data);

      if (res.success) {
        setSuccess('Administrator registered successfully! Redirecting to login...');
        setTimeout(async () => {
          await checkSetupStatus();
          navigate('/login');
        }, 2000);
      } else {
        setError(res.message || 'Setup failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container fade-in">
      <div className="setup-card glass">
        <div className="setup-header">
          <div className="setup-logo">
            <span className="logo-brand">Medi<span className="logo-accent">Recall</span></span>
          </div>
          <h1>System Configuration</h1>
          <p className="setup-subtitle">Register the Primary Hospital Administrator account to initialize MediRecall.</p>
        </div>

        {error && <div className="setup-alert error">{error}</div>}
        {success && <div className="setup-alert success">{success}</div>}

        <form onSubmit={handleSubmit} className="setup-form" encType="multipart/form-data">
          {/* Avatar Upload */}
          <div className="avatar-upload-section">
            <div className="avatar-frame">
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar Preview" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  <span>Upload Profile Photo</span>
                </div>
              )}
            </div>
            <label htmlFor="profilePicture" className="btn-secondary file-upload-btn">
              Select Image
            </label>
            <input
              type="file"
              id="profilePicture"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="e.g. Dr. Arthur Pendelton"
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
                placeholder="e.g. AD-9081"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g. admin@hospital.org"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
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

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
              />
              <span className="field-hint">Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol</span>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary setup-submit-btn" disabled={loading}>
            {loading ? 'Initializing System...' : 'Initialize & Register Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
