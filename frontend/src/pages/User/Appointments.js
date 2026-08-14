import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cancelMyAppointment, getMyAppointments } from '../../api/api';
import { ConfirmDialog, EmptyState, PageHeader, Skeleton, StatusBadge } from '../../components/UI';
import './Appointments.css';

const filters = ['All', 'Upcoming', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];
const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString([], { day: '2-digit', month: 'long', year: 'numeric' });

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const result = await getMyAppointments(); if (result.success) setAppointments(result.data || []); }
    catch (err) { setError(err.response?.data?.message || 'Something went wrong while retrieving your appointments.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!notice) return undefined; const timer = setTimeout(() => setNotice(''), 4000); return () => clearTimeout(timer); }, [notice]);

  const visible = useMemo(() => appointments.filter((item) => {
    if (filter === 'All') return true;
    if (filter === 'Upcoming') return ['Pending', 'Confirmed'].includes(item.status);
    return item.status === filter;
  }), [appointments, filter]);

  const cancel = async () => {
    setCancelling(true);
    try {
      const result = await cancelMyAppointment(cancelTarget.id);
      if (result.success) { setAppointments((current) => current.map((item) => item.id === cancelTarget.id ? result.data : item)); setNotice('Appointment cancelled successfully.'); setCancelTarget(null); }
    } catch (err) { setError(err.response?.data?.message || 'Unable to cancel the appointment.'); setCancelTarget(null); }
    finally { setCancelling(false); }
  };

  return <div className="appointments-page fade-in">
    <PageHeader eyebrow="Patient services" title="My Appointments" description="View and manage your scheduled medical appointments." action={<Link className="btn-primary appointments-book" to="/user/book-appointment">Book Appointment</Link>} />
    {notice && <div className="appointments-toast" role="status">{notice}</div>}
    {error && <div className="appointments-error" role="alert"><strong>Unable to load appointments</strong><span>{error}</span><button onClick={load}>Try Again</button></div>}
    <div className="appointment-filters" role="tablist" aria-label="Appointment filters">{filters.map((item) => <button key={item} role="tab" aria-selected={filter === item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>
    {loading ? <Skeleton cards={3} /> : visible.length === 0 ? <EmptyState symbol="+" title={filter === 'All' ? 'No appointments yet' : `No ${filter.toLowerCase()} appointments`} message={filter === 'All' ? "You haven't scheduled any appointments." : 'Appointments matching this filter will appear here.'} action={<Link className="btn-primary appointments-book" to="/user/book-appointment">Book Your First Appointment</Link>} /> : <div className="appointment-list">{visible.map((item) => <article className="appointment-card" key={item.id}><div className="appointment-date"><strong>{new Date(`${item.appointmentDate}T00:00:00`).getDate()}</strong><span>{new Date(`${item.appointmentDate}T00:00:00`).toLocaleString([], { month: 'short' }).toUpperCase()}</span></div><div className="appointment-main"><div className="appointment-card-head"><div><h2>{item.doctorName}</h2><p>{item.specialization}</p></div><StatusBadge status={item.status} /></div><div className="appointment-meta"><span><b>Date</b>{formatDate(item.appointmentDate)}</span><span><b>Time</b>{item.appointmentTime}</span><span><b>Appointment ID</b>{item.appointmentId}</span></div><div className="appointment-reason"><b>Reason for visit</b><p>{item.reasonForVisit}</p></div><div className="appointment-card-actions"><Link to={`/user/doctors/${item.doctorId}`}>View Doctor</Link>{['Pending', 'Confirmed'].includes(item.status) && <button onClick={() => setCancelTarget(item)}>Cancel Appointment</button>}</div></div></article>)}</div>}
    <ConfirmDialog open={!!cancelTarget} title="Cancel appointment?" message={cancelTarget ? `Are you sure you want to cancel your appointment with ${cancelTarget.doctorName} on ${formatDate(cancelTarget.appointmentDate)} at ${cancelTarget.appointmentTime}?` : ''} cancelLabel="Keep Appointment" confirmLabel="Cancel Appointment" onClose={() => setCancelTarget(null)} onConfirm={cancel} busy={cancelling} />
  </div>;
}
