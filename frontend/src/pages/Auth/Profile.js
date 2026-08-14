import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { updateProfile, changePassword, getMyPatientProfile, updateMyPatientProfile } from '../../api/api';
import './Profile.css';

export default function Profile() {
  const { user, syncProfile } = useContext(AuthContext);

  // Profile data states
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phoneNumber: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [patientData, setPatientData] = useState({ patientId: '', dateOfBirth: '', gender: '', bloodGroup: 'Unknown' });

  // Password data states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const scrollToPageTop = () => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  };

  // Populate data on mount/user change
  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || ''
      });
      setPreviewUrl(user.profilePicture ? `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}${user.profilePicture}` : '');
    }
  }, [user]);

  useEffect(() => {
    if (user?.role !== 'User') return;
    getMyPatientProfile().then((res) => {
      const patient = res.data;
      setPatientData({
        patientId: patient.patientId || '',
        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : '',
        gender: patient.gender || '',
        bloodGroup: patient.bloodGroup || 'Unknown'
      });
    }).catch(() => setProfileError('Unable to load clinical profile details.'));
  }, [user]);

  // Profile fields handler
  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
    setProfileError('');
  };

  // Avatar file upload handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
      setProfileError('');
    }
  };

  // Profile submission handler
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    if (!profileData.fullName || !profileData.phoneNumber) {
      setProfileError('Name and Phone Number are required fields.');
      setProfileLoading(false);
      scrollToPageTop();
      return;
    }

    try {
      const data = new FormData();
      data.append('fullName', profileData.fullName.trim());
      data.append('phoneNumber', profileData.phoneNumber.trim());
      if (profilePicture) {
        data.append('profilePicture', profilePicture);
      }

      const res = await updateProfile(data);

      if (user?.role === 'User') {
        await updateMyPatientProfile({ dateOfBirth: patientData.dateOfBirth, gender: patientData.gender, bloodGroup: patientData.bloodGroup });
      }

      if (res.success && res.data) {
        setProfileSuccess('Profile updated successfully!');
        syncProfile(res.data);
      } else {
        setProfileError(res.message || 'Failed to update profile details.');
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || 'An error occurred.');
    } finally {
      setProfileLoading(false);
      scrollToPageTop();
    }
  };

  // Password fields handler
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPwError('');
  };

  // Password password submission handler
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    setPwLoading(true);

    const { currentPassword, newPassword, confirmNewPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPwError('Please fill in all security fields.');
      setPwLoading(false);
      scrollToPageTop();
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPwError('New passwords do not match.');
      setPwLoading(false);
      scrollToPageTop();
      return;
    }

    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters long.');
      setPwLoading(false);
      scrollToPageTop();
      return;
    }

    try {
      const res = await changePassword(currentPassword, newPassword, confirmNewPassword);

      if (res.success) {
        setPwSuccess('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
      } else {
        setPwError(res.message || 'Failed to update password.');
      }
    } catch (err) {
      setPwError(err.response?.data?.message || err.message || 'An error occurred.');
    } finally {
      setPwLoading(false);
      scrollToPageTop();
    }
  };

  return (
    <div className="profile-container fade-in">
      <div className="profile-grid-layout">
        
        {/* Profile details form */}
        <section className="profile-side glass">
          <div className="section-head">
            <h3>Profile Settings</h3>
            <p>Update your personal information and profile picture</p>
          </div>

          {profileError && <div className="profile-alert error">{profileError}</div>}
          {profileSuccess && <div className="profile-alert success">{profileSuccess}</div>}

          <form onSubmit={handleProfileSubmit} className="profile-form">
            <div className="profile-avatar-row">
              <div className="profile-pic-container">
                {previewUrl ? (
                  <img src={previewUrl} alt="User Avatar" className="profile-pic-img" />
                ) : (
                  <div className="profile-pic-initials">
                    {user?.fullName?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="avatar-actions">
                <label htmlFor="avatar-file" className="btn-secondary avatar-btn">
                  Upload New Photo
                </label>
                <input
                  type="file"
                  id="avatar-file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <span className="avatar-hint">JPG, PNG, WEBP. Max 5MB.</span>
              </div>
            </div>

            <div className="profile-inputs">
              <div className="form-group inline-group">
                <label>System Role</label>
                <input type="text" value={user?.role || ''} disabled className="disabled-input" />
              </div>

              <div className="form-group inline-group">
                <label>Employee ID</label>
                <input type="text" value={user?.employeeId || ''} disabled className="disabled-input" />
              </div>

              {user?.role === 'Doctor' && (
                <>
                  <div className="form-group inline-group">
                    <label>Medical License</label>
                    <input type="text" value={user?.medicalLicenseNumber || ''} disabled className="disabled-input" />
                  </div>
                  <div className="form-group inline-group">
                    <label>Assigned Department</label>
                    <input type="text" value={user?.department || ''} disabled className="disabled-input" />
                  </div>
                </>
              )}

              {user?.role === 'User' && (
                <>
                  <div className="form-group inline-group">
                    <label>Patient ID</label>
                    <input type="text" value={patientData.patientId} disabled className="disabled-input" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="dateOfBirth">Date of Birth</label>
                    <input id="dateOfBirth" type="date" value={patientData.dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setPatientData({ ...patientData, dateOfBirth: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="gender">Gender</label>
                    <select id="gender" value={patientData.gender} onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}>
                      <option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="bloodGroup">Blood Group</label>
                    <select id="bloodGroup" value={patientData.bloodGroup} onChange={(e) => setPatientData({ ...patientData, bloodGroup: e.target.value })}>
                      {['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => <option key={group}>{group}</option>)}
                    </select>
                  </div>
                </>
              )}

              <hr className="profile-divider" />

              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={profileData.fullName}
                  onChange={handleProfileChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  disabled
                  className="disabled-input"
                />
                <span className="field-hint">Email is your account identifier and cannot be changed.</span>
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="text"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={profileData.phoneNumber}
                  onChange={handleProfileChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary profile-save-btn" disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Save Profile Details'}
            </button>
          </form>
        </section>

        {/* Change password form */}
        <section className="profile-side glass">
          <div className="section-head">
            <h3>Change Password</h3>
            <p>Ensure your account is using a secure, complex password policy</p>
          </div>

          {pwError && <div className="profile-alert error">{pwError}</div>}
          {pwSuccess && <div className="profile-alert success">{pwSuccess}</div>}

          <form onSubmit={handlePasswordSubmit} className="pw-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
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
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
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
                value={passwordData.confirmNewPassword}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn-primary password-save-btn" disabled={pwLoading}>
              {pwLoading ? 'Changing...' : 'Update Session Password'}
            </button>
          </form>
        </section>

      </div>
    </div>
  );
}
