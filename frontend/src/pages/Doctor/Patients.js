import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDoctorPatients } from '../../api/api';
import { EmptyState, PageHeader, Skeleton } from '../../components/UI';
import './PatientWorkspace.css';

export default function Patients() {
  const [patients, setPatients] = useState([]); const [query, setQuery] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { getDoctorPatients().then((res) => res.success && setPatients(res.data || [])).catch(() => setError('Unable to retrieve patients.')).finally(() => setLoading(false)); }, []);
  const visible = useMemo(() => patients.filter((p) => `${p.patientId} ${p.fullName} ${p.email}`.toLowerCase().includes(query.toLowerCase())), [patients, query]);
  return <div className="patients-page fade-in"><PageHeader eyebrow="Clinical workspace" title="Patients" description="Open a verified patient record before reviewing clinical information or using AI assistance." /><div className="patient-search"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by patient ID, name or email" aria-label="Search patients" /></div>{error && <div className="clinical-error">{error}</div>}{loading ? <Skeleton cards={3} /> : visible.length === 0 ? <EmptyState title="No patients found" message="Registered patient accounts will appear here." /> : <div className="patient-directory-grid">{visible.map((patient) => <Link to={`/doctor/patients/${patient.patientId}`} className="patient-directory-card glass-interactive" key={patient._id}>{patient.profilePicture ? <img src={`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}${patient.profilePicture}`} alt="" /> : <span>{patient.fullName.slice(0,2).toUpperCase()}</span>}<div><strong>{patient.fullName}</strong><small>{patient.patientId}</small><p>{patient.gender || 'Demographics not recorded'} · {patient.bloodGroup}</p></div><b>Open record →</b></Link>)}</div>}</div>;
}
