import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signupUser } from '../../api/api';
import './Signup.css';

const initialForm = {
  fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: ''
};

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const onChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  };

  const onImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPG, PNG or WEBP image smaller than 5 MB.');
      return;
    }
    setProfilePicture(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (Object.values(form).some((value) => !value.trim())) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value.trim()));
      if (profilePicture) data.append('profilePicture', profilePicture);
      const result = await signupUser(data);
      if (result.success) navigate('/login', { replace: true, state: { message: result.message } });
      else setError(result.message || 'Unable to create your account.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-wrap fade-in">
        <Link to="/login" className="signup-brand">Medi<span>Recall</span></Link>
        <div className="signup-card">
          <header><h1>Create your account</h1><p>Set up your personal MediRecall profile</p></header>
          {error && <div className="login-alert" role="alert">{error}</div>}
          <form onSubmit={handleSubmit} className="signup-form">
            <label className="avatar-picker">
              {preview ? <img src={preview} alt="Profile preview" /> : <span>{form.fullName?.charAt(0).toUpperCase() || '+'}</span>}
              <div><strong>Profile picture</strong><small>JPG, PNG or WEBP, up to 5 MB</small></div>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onImageChange} />
            </label>
            <div className="signup-grid">
              <label><span>Full name</span><input name="fullName" value={form.fullName} onChange={onChange} autoComplete="name" placeholder="Your full name" required /></label>
              <label><span>Email</span><input type="email" name="email" value={form.email} onChange={onChange} autoComplete="email" placeholder="you@example.com" required /></label>
              <label className="wide"><span>Phone number</span><input type="tel" name="phoneNumber" value={form.phoneNumber} onChange={onChange} autoComplete="tel" placeholder="Phone number" required /></label>
              <label><span>Password</span><input type={showPasswords ? 'text' : 'password'} name="password" value={form.password} onChange={onChange} autoComplete="new-password" placeholder="Strong password" required /></label>
              <label><span>Confirm password</span><input type={showPasswords ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={onChange} autoComplete="new-password" placeholder="Repeat password" required /></label>
            </div>
            <label className="show-passwords"><input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} /> Show passwords</label>
            <p className="password-hint">Use at least 8 characters with uppercase, lowercase, a number and a special character.</p>
            <button className="login-btn" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
          </form>
          <p className="signup-login">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
