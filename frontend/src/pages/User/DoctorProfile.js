import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getUserDoctor } from '../../api/api';
import { PageHeader, Skeleton, StatusBadge } from '../../components/UI';
import './DoctorProfile.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
export default function DoctorProfile() {
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { getUserDoctor(doctorId).then((result) => result.success && setDoctor(result.data)).catch((err) => setError(err.response?.data?.message || 'Unable to load this doctor profile.')).finally(() => setLoading(false)); }, [doctorId]);
  if (loading) return <div className="doctor-profile-page"><Skeleton cards={2} /></div>;
  if (error || !doctor) return <div className="doctor-profile-page"><div className="doctor-profile-error"><h2>Doctor profile unavailable</h2><p>{error}</p><Link to="/user/doctors">Return to doctors</Link></div></div>;
  return <div className="doctor-profile-page fade-in"><PageHeader eyebrow="Healthcare professional" title="Doctor Profile" description="Professional credentials and consultation information." action={<Link to="/user/book-appointment" state={{ doctorId: doctor._id }} className="btn-primary doctor-profile-cta">Book Appointment</Link>} /><section className="doctor-profile-hero glass">{doctor.profilePicture ? <img src={`${BACKEND_URL}${doctor.profilePicture}`} alt={doctor.fullName} /> : <div className="doctor-profile-avatar">{doctor.fullName.slice(0,2).toUpperCase()}</div>}<div><StatusBadge status={doctor.status} /><h1>{doctor.fullName}</h1><p>{doctor.department}</p><span>{doctor.employeeId}</span></div></section><div className="doctor-profile-grid"><section className="doctor-profile-info glass"><h2>Professional information</h2><p>{doctor.doctorInformation || 'No additional professional information has been provided.'}</p></section><aside className="doctor-credentials glass"><h2>Credentials & contact</h2><dl><div><dt>Medical license</dt><dd>{doctor.medicalLicenseNumber}</dd></div><div><dt>Specialization</dt><dd>{doctor.department}</dd></div><div><dt>Email</dt><dd><a href={`mailto:${doctor.email}`}>{doctor.email}</a></dd></div><div><dt>Phone</dt><dd><a href={`tel:${doctor.phoneNumber}`}>{doctor.phoneNumber}</a></dd></div></dl></aside></div></div>;
}
