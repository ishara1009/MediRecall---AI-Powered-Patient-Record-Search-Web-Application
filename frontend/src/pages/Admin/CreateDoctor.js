import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDoctor } from '../../api/api';
import './CreateDoctor.css';

export default function CreateDoctor() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    employeeId: '',
    medicalLicenseNumber: '',
    department: '',
    temporaryPassword: ''
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

  const generateTempPassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+';
    
    let password = '';
    // ensure policy met
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += special.charAt(Math.floor(Math.random() * special.length));

    const allChars = lowercase + uppercase + numbers + special;
    for (let i = 0; i < 6; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // shuffle
    password = password.split('').sort(() => 0.5 - Math.random()).join('');

    setFormData({ ...formData, temporaryPassword: password });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { fullName, email, phoneNumber, employeeId, medicalLicenseNumber, department, temporaryPassword } = formData;

    // Standard client checks
    if (!fullName || !email || !phoneNumber || !employeeId || !medicalLicenseNumber || !department || !temporaryPassword) {
      setError('Please fill in all details.');
      setLoading(false);
      return;
    }

    if (temporaryPassword.length < 8) {
      setError('Temporary password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append('fullName', fullName.trim());
      data.append('email', email.trim());
      data.append('phoneNumber', phoneNumber.trim());
      data.append('employeeId', employeeId.trim());
      data.append('medicalLicenseNumber', medicalLicenseNumber.trim());
      data.append('department', department.trim());
      data.append('temporaryPassword', temporaryPassword);
      if (profilePicture) {
        data.append('profilePicture', profilePicture);
      }

      const res = await createDoctor(data);

      if (res.success) {
        setSuccess(`Doctor "${fullName}" registered successfully! Redirecting to management page...`);
        setTimeout(() => {
          navigate('/admin/doctors');
        }, 2200);
      } else {
        setError(res.message || 'Failed to create doctor account.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during account creation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-doc-container fade-in">
      <div className="create-doc-card glass">
        <div className="create-doc-header">
          <h1>Register New Physician</h1>
          <p className="subtitle">Creations will enforce a forced password change during the doctor's initial log in.</p>
        </div>

        {error && <div className="create-doc-alert error">{error}</div>}
        {success && <div className="create-doc-alert success">{success}</div>}

        <form onSubmit={handleSubmit} className="create-doc-form" encType="multipart/form-data">
          
          {/* Avatar Upload */}
          <div className="avatar-upload-box">
            <div className="avatar-preview-circle">
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar Preview" className="preview-img" />
              ) : (
                <div className="placeholder-text">Avatar</div>
              )}
            </div>
            <label htmlFor="profilePicture" className="btn-secondary select-photo-btn">
              Select Photo
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
                placeholder="e.g. Dr. Jane Foster"
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
                placeholder="e.g. j.foster@hospital.org"
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
                placeholder="e.g. +1 555-0182"
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
                placeholder="e.g. DR-8091"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="medicalLicenseNumber">Medical License Number</label>
              <input
                type="text"
                id="medicalLicenseNumber"
                name="medicalLicenseNumber"
                value={formData.medicalLicenseNumber}
                onChange={handleInputChange}
                placeholder="e.g. LIC-90182-A"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Assigned Department</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g. Cardiology"
                required
              />
            </div>

            <div className="form-group pwd-group">
              <label htmlFor="temporaryPassword">Temporary Password</label>
              <div className="pwd-input-combo">
                <input
                  type="text"
                  id="temporaryPassword"
                  name="temporaryPassword"
                  value={formData.temporaryPassword}
                  onChange={handleInputChange}
                  placeholder="Generate or enter password"
                  required
                />
                <button
                  type="button"
                  onClick={generateTempPassword}
                  className="btn-secondary gen-pwd-btn"
                >
                  Generate
                </button>
              </div>
              <span className="field-hint">Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol</span>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/admin/doctors')}
              className="btn-secondary cancel-btn"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary submit-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create Doctor Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
