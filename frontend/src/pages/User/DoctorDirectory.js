import React, { useEffect, useState } from 'react';
import { getUserDoctors } from '../../api/api';
import './DoctorDirectory.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export default function DoctorDirectory() {
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const result = await getUserDoctors();
        if (result.success) setDoctors(result.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load doctor details.');
      } finally {
        setLoading(false);
      }
    };
    loadDoctors();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredDoctors = doctors.filter((doctor) =>
    [doctor.employeeId, doctor.fullName, doctor.email, doctor.phoneNumber,
      doctor.department, doctor.doctorInformation, doctor.medicalLicenseNumber, doctor.status]
      .some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
  );

  return (
    <div className="user-doctors fade-in">
      <header className="user-doctors-header">
        <div><span>MEDIRECALL DIRECTORY</span><h1>Our Doctors</h1><p>View registered doctor profiles and contact details.</p></div>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search doctors or specialization" aria-label="Search doctors" />
      </header>
      {error && <div className="directory-error">{error}</div>}
      {loading ? <div className="directory-state">Loading doctors...</div> : filteredDoctors.length === 0 ? (
        <div className="directory-state glass">No doctors found.</div>
      ) : (
        <div className="doctor-card-grid">
          {filteredDoctors.map((doctor) => (
            <article className="doctor-directory-card glass" key={doctor._id}>
              <div className="doctor-directory-top">
                {doctor.profilePicture ? <img src={`${BACKEND_URL}${doctor.profilePicture}`} alt={doctor.fullName} /> : <div className="directory-avatar">{doctor.fullName?.slice(0, 2).toUpperCase()}</div>}
                <div><h2>{doctor.fullName}</h2><p>{doctor.department}</p><span className={`directory-status ${doctor.status}`}>{doctor.status}</span></div>
              </div>
              <dl>
                <div><dt>Doctor ID</dt><dd>{doctor.employeeId}</dd></div>
                <div><dt>Email</dt><dd><a href={`mailto:${doctor.email}`}>{doctor.email}</a></dd></div>
                <div><dt>Phone Number</dt><dd><a href={`tel:${doctor.phoneNumber}`}>{doctor.phoneNumber}</a></dd></div>
                <div><dt>Medical License No.</dt><dd>{doctor.medicalLicenseNumber}</dd></div>
              </dl>
              {doctor.doctorInformation && (
                <div className="doctor-information"><h3>Doctor Information</h3><p>{doctor.doctorInformation}</p></div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
