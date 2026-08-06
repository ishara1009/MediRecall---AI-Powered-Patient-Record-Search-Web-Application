import React, { useEffect, useState } from 'react';
import { getDoctors, updateDoctor, deleteDoctor, toggleDoctorStatus, resetDoctorPassword } from '../../api/api';
import './DoctorManagement.css';

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals status
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  
  // Doctor form edit parameters
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    medicalLicenseNumber: '',
    department: ''
  });
  const [editFile, setEditFile] = useState(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState('');

  // Password reset parameters
  const [tempPassword, setTempPassword] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDocs = async () => {
    try {
      const res = await getDoctors();
      if (res.success) {
        setDoctors(res.data);
      }
    } catch (err) {
      setError('Failed to fetch doctor records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleToggleStatus = async (doctor) => {
    setError('');
    setSuccess('');
    const newStatus = doctor.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await toggleDoctorStatus(doctor._id, newStatus);
      if (res.success) {
        setSuccess(`Status of "${doctor.fullName}" toggled to ${newStatus} successfully.`);
        // Reload
        fetchDocs();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle status.');
    }
  };

  const handleDelete = async (doctor) => {
    if (!window.confirm(`Are you absolutely sure you want to delete doctor account "${doctor.fullName}"? All his chatbot sessions and history will be permanently deleted.`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await deleteDoctor(doctor._id);
      if (res.success) {
        setSuccess(`Doctor "${doctor.fullName}" deleted successfully.`);
        fetchDocs();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete doctor.');
    }
  };

  // Open edit modal
  const openEditModal = (doctor) => {
    setSelectedDoctor(doctor);
    setEditForm({
      fullName: doctor.fullName || '',
      email: doctor.email || '',
      phoneNumber: doctor.phoneNumber || '',
      medicalLicenseNumber: doctor.medicalLicenseNumber || '',
      department: doctor.department || ''
    });
    setEditPreviewUrl(doctor.profilePicture ? `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}${doctor.profilePicture}` : '');
    setEditFile(null);
    setEditModalOpen(true);
    setError('');
    setSuccess('');
  };

  // Open reset password modal
  const openResetModal = (doctor) => {
    setSelectedDoctor(doctor);
    setTempPassword('');
    setResetModalOpen(true);
    setError('');
    setSuccess('');
  };

  // Handle Edit submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const formData = new FormData();
      formData.append('fullName', editForm.fullName.trim());
      formData.append('email', editForm.email.trim());
      formData.append('phoneNumber', editForm.phoneNumber.trim());
      formData.append('medicalLicenseNumber', editForm.medicalLicenseNumber.trim());
      formData.append('department', editForm.department.trim());
      if (editFile) {
        formData.append('profilePicture', editFile);
      }

      const res = await updateDoctor(selectedDoctor._id, formData);
      if (res.success) {
        setSuccess(`Doctor "${editForm.fullName}" updated successfully.`);
        setEditModalOpen(false);
        fetchDocs();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update doctor.');
    }
  };

  // Handle Password Reset submission
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (tempPassword.length < 8) {
      setError('Temporary password must be at least 8 characters long.');
      return;
    }

    try {
      const res = await resetDoctorPassword(selectedDoctor._id, tempPassword);
      if (res.success) {
        setSuccess(`Password for Doctor "${selectedDoctor.fullName}" has been reset. They will be forced to change it on next login.`);
        setResetModalOpen(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const q = searchQuery.toLowerCase();
    return (
      doc.fullName.toLowerCase().includes(q) ||
      doc.employeeId.toLowerCase().includes(q) ||
      doc.email.toLowerCase().includes(q) ||
      doc.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="doc-mgmt-container fade-in">
      <div className="mgmt-header">
        <div>
          <h1>Physician Directory</h1>
          <p className="subtitle">Manage physician profiles, status, credentials and access logs</p>
        </div>
        <div className="actions-header">
          <input
            type="text"
            placeholder="Search by name, ID, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-field"
          />
        </div>
      </div>

      {error && <div className="mgmt-alert error">{error}</div>}
      {success && <div className="mgmt-alert success">{success}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">Retrieving physician records...</div>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="empty-state glass">
          <p>No physician records found matching the criteria.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="doctors-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Employee ID</th>
                <th>Medical License</th>
                <th>Department</th>
                <th>Status</th>
                <th className="cell-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map((doc) => (
                <tr key={doc._id} className={doc.status === 'inactive' ? 'row-disabled' : ''}>
                  <td>
                    <div className="doctor-profile-cell">
                      <div className="doc-cell-avatar">
                        {doc.profilePicture ? (
                          <img src={`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}${doc.profilePicture}`} alt={doc.fullName} className="cell-avatar-img" />
                        ) : (
                          <div className="cell-avatar-initials">{doc.fullName.substring(0, 2).toUpperCase()}</div>
                        )}
                      </div>
                      <div className="doc-cell-info">
                        <span className="doc-cell-name">{doc.fullName}</span>
                        <span className="doc-cell-email">{doc.email}</span>
                        <span className="doc-cell-phone">{doc.phoneNumber}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="table-mono">{doc.employeeId}</span></td>
                  <td><span className="table-mono">{doc.medicalLicenseNumber}</span></td>
                  <td><span className="dept-badge">{doc.department}</span></td>
                  <td>
                    <button
                      onClick={() => handleToggleStatus(doc)}
                      className={`status-pill ${doc.status}`}
                      title="Click to toggle status"
                    >
                      {doc.status === 'active' ? 'Active' : 'Suspended'}
                    </button>
                  </td>
                  <td className="cell-actions">
                    <div className="action-button-group">
                      <button onClick={() => openEditModal(doc)} className="action-icon-btn edit-btn" title="Edit Profile">
                        Edit
                      </button>
                      <button onClick={() => openResetModal(doc)} className="action-icon-btn reset-btn" title="Reset Password">
                        Reset Pwd
                      </button>
                      <button onClick={() => handleDelete(doc)} className="action-icon-btn delete-btn" title="Delete Doctor">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-window glass">
            <h2>Edit Physician Profile</h2>
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="modal-avatar-uploader">
                <div className="modal-avatar-preview">
                  {editPreviewUrl ? (
                    <img src={editPreviewUrl} alt="Preview" />
                  ) : (
                    <span>No Avatar</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setEditFile(file);
                      setEditPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  id="modal-file-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="modal-file-upload" className="btn-secondary modal-avatar-btn">
                  Upload Photo
                </label>
              </div>

              <div className="modal-fields">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Medical License Number</label>
                  <input
                    type="text"
                    value={editForm.medicalLicenseNumber}
                    onChange={(e) => setEditForm({ ...editForm, medicalLicenseNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Assigned Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setEditModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-window glass modal-small">
            <h2>Force Password Reset</h2>
            <p className="modal-desc">
              Assign a new temporary password for <strong>{selectedDoctor?.fullName}</strong>. They will be forced to change it on their next login session.
            </p>
            <form onSubmit={handleResetPasswordSubmit} className="modal-form">
              <div className="form-group">
                <label>Temporary Password</label>
                <div className="pwd-input-combo">
                  <input
                    type="text"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="Enter min 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                      let pw = '';
                      for (let i = 0; i < 9; i++) {
                        pw += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                      }
                      setTempPassword(pw);
                    }}
                    className="btn-secondary"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setResetModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Apply Hard Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
