import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './UserDashboard.css';

export default function UserDashboard() {
  const { user } = useContext(AuthContext);
  const avatar = user?.profilePicture
    ? `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}${user.profilePicture}`
    : null;

  return (
    <div className="personal-dashboard fade-in">
      <section className="personal-hero glass">
        {avatar ? <img src={avatar} alt={user.fullName} /> : <div className="personal-avatar">{user?.fullName?.slice(0, 2).toUpperCase()}</div>}
        <div><span className="personal-label">PERSONAL DASHBOARD</span><h1>Welcome, {user?.fullName}</h1><p>Your MediRecall account is ready.</p></div>
      </section>
      <section className="personal-details glass">
        <div><span>Name</span><strong>{user?.fullName}</strong></div>
        <div><span>Email</span><strong>{user?.email}</strong></div>
        <div><span>Phone</span><strong>{user?.phoneNumber}</strong></div>
      </section>
      <section className="personal-action glass">
        <div><h2>Manage your profile</h2><p>Update your profile picture, contact details or password.</p></div>
        <Link to="/user/profile" className="btn-primary">Open profile settings</Link>
      </section>
    </div>
  );
}
