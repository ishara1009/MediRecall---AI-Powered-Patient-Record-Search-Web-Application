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

      <div className="patient-dashboard-grid">
        <section className="appointments-panel glass">
          <div className="panel-heading">
            <div><span className="section-eyebrow">CARE SCHEDULE</span><h2>Upcoming appointments</h2></div>
            <Link to="/user/doctors" className="dashboard-text-link">Book appointment</Link>
          </div>
          <div className="appointment-empty">
            <div className="calendar-mark"><strong>—</strong><span>NO DATE</span></div>
            <div><h3>No upcoming appointments</h3><p>Choose a doctor from the directory to begin planning your next consultation.</p></div>
          </div>
        </section>

        <aside className="care-summary glass">
          <span className="section-eyebrow">CARE SUMMARY</span>
          <h2>Your health workspace</h2>
          <div className="care-metrics">
            <div><strong>0</strong><span>Upcoming</span></div>
            <div><strong>0</strong><span>Prescriptions</span></div>
            <div><strong>0</strong><span>New messages</span></div>
          </div>
        </aside>
      </div>

      <section className="services-section">
        <div className="services-heading"><div><span className="section-eyebrow">PATIENT SERVICES</span><h2>Quick access</h2></div><p>Manage your care from one secure workspace.</p></div>
        <div className="service-grid">
          <Link to="/user/doctors" className="service-card glass-interactive">
            <span className="service-icon">01</span><h3>Book an appointment</h3><p>Select a doctor by specialization and view their contact information.</p><strong>Browse doctors →</strong>
          </Link>
          <div className="service-card glass service-card-pending">
            <span className="service-icon">02</span><span className="coming-badge">Coming soon</span><h3>Medical records</h3><p>Review visit summaries, test results and securely shared clinical documents.</p>
          </div>
          <div className="service-card glass service-card-pending">
            <span className="service-icon">03</span><span className="coming-badge">Coming soon</span><h3>Prescriptions</h3><p>Track current medicines, dosage instructions and prescription history.</p>
          </div>
          <div className="service-card glass service-card-pending">
            <span className="service-icon">04</span><span className="coming-badge">Coming soon</span><h3>Secure messages</h3><p>Receive care updates and communicate securely with your healthcare team.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
