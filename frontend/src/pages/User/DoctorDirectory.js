import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserDoctors } from '../../api/api';
import { EmptyState, PageHeader, Skeleton, StatusBadge } from '../../components/UI';
import './DoctorDirectory.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export default function DoctorDirectory() {
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState('');
  const [specialization, setSpecialization] = useState('All');
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
  const specializations = ['All', ...new Set(doctors.map((doctor) => doctor.department).filter(Boolean).sort())];
  const filteredDoctors = doctors.filter((doctor) =>
    [doctor.employeeId, doctor.fullName, doctor.email, doctor.phoneNumber,
      doctor.department, doctor.doctorInformation, doctor.medicalLicenseNumber, doctor.status]
      .some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
  ).filter((doctor) => specialization === 'All' || doctor.department === specialization);

  return (
    <div className="user-doctors fade-in">
      <PageHeader eyebrow="MediRecall directory" title="Find a Doctor" description="Browse available healthcare professionals and book your appointment." />
      <div className="doctor-directory-filters"><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, license or specialization" aria-label="Search doctors" /><select value={specialization} onChange={(e) => setSpecialization(e.target.value)} aria-label="Filter by specialization">{specializations.map((item) => <option key={item}>{item}</option>)}</select></div>
      {error && <div className="directory-error">{error}</div>}
      {loading ? <Skeleton cards={3} /> : filteredDoctors.length === 0 ? (
        <EmptyState symbol="+" title="No doctors found" message="Try changing your search or specialization filter." />
      ) : (
        <div className="doctor-card-grid">
          {filteredDoctors.map((doctor) => (
            <article className="doctor-directory-card glass" key={doctor._id}>
              <div className="doctor-directory-top">
                {doctor.profilePicture ? <img src={`${BACKEND_URL}${doctor.profilePicture}`} alt={doctor.fullName} /> : <div className="directory-avatar">{doctor.fullName?.slice(0, 2).toUpperCase()}</div>}
                <div><h2>{doctor.fullName}</h2><p>{doctor.specialization || doctor.department}</p><StatusBadge status={doctor.availability?.status || doctor.status} /></div>
              </div>
              <dl>
                <div><dt>Doctor ID</dt><dd>{doctor.employeeId}</dd></div>
                <div><dt>Email</dt><dd><a href={`mailto:${doctor.email}`}>{doctor.email}</a></dd></div>
                <div><dt>Phone Number</dt><dd><a href={`tel:${doctor.phoneNumber}`}>{doctor.phoneNumber}</a></dd></div>
                <div><dt>Medical License No.</dt><dd>{doctor.medicalLicenseNumber}</dd></div>
                <div><dt>Department</dt><dd>{doctor.department}</dd></div>
                <div><dt>Availability</dt><dd>{doctor.availability?.nextAvailable ? `Next: ${doctor.availability.nextAvailable}` : doctor.availability?.leaveUntil ? `On leave until ${doctor.availability.leaveUntil}` : doctor.availability?.status || 'Unavailable'}</dd></div>
                <div><dt>Clinic</dt><dd>{[doctor.clinicLocation, doctor.floor && `Floor ${doctor.floor}`, doctor.roomNumber && `Room ${doctor.roomNumber}`].filter(Boolean).join(' · ') || 'Contact hospital'}</dd></div>
              </dl>
              {doctor.doctorInformation && (
                <div className="doctor-information"><h3>Doctor Information</h3><p>{doctor.doctorInformation}</p></div>
              )}
              <div className="doctor-directory-actions"><Link to={`/user/doctors/${doctor.employeeId}`}>View Profile</Link>{doctor.status === 'active' && <Link to="/user/book-appointment" state={{ doctorId: doctor._id }}>Book Appointment</Link>}</div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
