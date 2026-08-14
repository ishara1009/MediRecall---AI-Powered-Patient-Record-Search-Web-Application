import React, { useContext, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import hospital from '../../config/hospitalInfo';
import './Public.css';

const dashboardFor = (user) => user?.role === 'Admin' ? '/admin/dashboard' : user?.role === 'Doctor' ? '/doctor/dashboard' : '/user/dashboard';
const links = [['Home','/'],['About','/about'],['Features','/features'],['How It Works','/how-it-works'],['Doctors','/doctors']];

export const setPublicMeta = (title, description) => {
  document.title = title;
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
  meta.content = description;
};

export function SectionHeader({ eyebrow, title, text }) {
  return <header className="public-section-head">{eyebrow && <span>{eyebrow}</span>}<h2>{title}</h2>{text && <p>{text}</p>}</header>;
}

export function DoctorCard({ doctor }) {
  const image = doctor.profilePicture ? `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}${doctor.profilePicture}` : '';
  return <article className="public-doctor-card">{image ? <img src={image} alt={`${doctor.fullName}`} /> : <div className="doctor-placeholder" aria-hidden="true">{doctor.fullName.slice(0,2).toUpperCase()}</div>}<div><span>{doctor.department || 'Healthcare Professional'}</span><h3>{doctor.fullName}</h3><p>{doctor.doctorInformation || 'Providing professional patient-centered healthcare services.'}</p><Link to={`/doctors/${doctor.employeeId}`}>View Profile</Link></div></article>;
}

export default function PublicLayout() {
  const { user, token } = useContext(AuthContext); const [open,setOpen] = useState(false); const location=useLocation();
  useEffect(()=>setOpen(false),[location.pathname]);
  return <div className="public-site">
    <div className="contact-bar"><div><span>{hospital.name} · {hospital.location}</span><nav aria-label="Hospital contact"><a href={`tel:${hospital.generalPhone}`}>{hospital.generalPhone}</a><a href={`mailto:${hospital.email}`}>{hospital.email}</a><a href={`tel:${hospital.emergencyPhone}`}>Emergency: {hospital.emergencyPhone}</a></nav></div></div>
    <header className="public-nav"><Link className="public-brand" to="/"><span className="brand-mark">+</span><b>Medi<span>Recall</span></b></Link><button className="menu-toggle" onClick={()=>setOpen(!open)} aria-expanded={open} aria-label="Toggle navigation"><i></i><i></i><i></i></button><nav className={open?'open':''}>{links.map(([label,to])=><NavLink key={to} to={to} end={to==='/' }>{label}</NavLink>)}<div className="public-nav-actions">{user&&token?<Link className="public-primary" to={dashboardFor(user)}>Dashboard</Link>:<><Link className="public-outline" to="/login">Sign In</Link><Link className="public-primary" to="/signup">Get Started</Link></>}</div></nav></header>
    <main><Outlet /></main>
    <footer className="public-footer"><div className="footer-grid"><div><Link className="public-brand footer-brand" to="/"><span className="brand-mark">+</span><b>Medi<span>Recall</span></b></Link><p>{hospital.tagline}</p><small>{hospital.name}<br/>{hospital.location}</small></div><div><h3>Platform</h3><Link to="/">Home</Link><Link to="/features">Features</Link><Link to="/how-it-works">How It Works</Link><Link to="/doctors">Doctors</Link></div><div><h3>About</h3><Link to="/about">About MediRecall</Link><Link to="/doctors">Healthcare Professionals</Link></div><div><h3>Support</h3><a href={`tel:${hospital.generalPhone}`}>General: {hospital.generalPhone}</a><a href={`tel:${hospital.appointmentPhone}`}>Appointments: {hospital.appointmentPhone}</a><a href={`mailto:${hospital.email}`}>{hospital.email}</a></div></div><div className="footer-bottom">© 2026 MediRecall · {hospital.name}. All rights reserved.</div></footer>
  </div>;
}
