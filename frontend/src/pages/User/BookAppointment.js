import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { createAppointment, getAvailableAppointmentSlots, getUserDoctors } from '../../api/api';
import './BookAppointment.css';

const today = new Date().toISOString().slice(0, 10);
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export default function BookAppointment() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const selectedDoctor = useMemo(() => doctors.find((doctor) => doctor._id === doctorId), [doctors, doctorId]);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const result = await getUserDoctors();
        if (result.success) {
          const activeDoctors = (result.data || []).filter((doctor) => doctor.status === 'active');
          setDoctors(activeDoctors);
          const requestedDoctor = activeDoctors.find((doctor) => doctor._id === location.state?.doctorId);
          if (requestedDoctor) setDoctorId(requestedDoctor._id);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load available doctors.');
      } finally {
        setLoadingDoctors(false);
      }
    };
    loadDoctors();
  }, [location.state]);

  useEffect(() => {
    setAppointmentTime('');
    setSlots([]);
    if (!doctorId || !appointmentDate) return;

    let active = true;
    const loadSlots = async () => {
      setLoadingSlots(true);
      setError('');
      try {
        const result = await getAvailableAppointmentSlots(doctorId, appointmentDate);
        if (active && result.success) setSlots(result.data?.slots || []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Unable to load appointment times.');
      } finally {
        if (active) setLoadingSlots(false);
      }
    };
    loadSlots();
    return () => { active = false; };
  }, [doctorId, appointmentDate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess(null);
    const reason = reasonForVisit.trim();
    if (!doctorId || !appointmentDate || !appointmentTime || reason.length < 3) {
      setError('Select a doctor, date and time, and enter a reason for your visit.');
      return;
    }
    if (appointmentDate < today) {
      setError('Appointment date cannot be in the past.');
      return;
    }
    if (reason.length > 1000) {
      setError('Reason for visit cannot exceed 1000 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createAppointment({ doctorId, appointmentDate, appointmentTime, reasonForVisit: reason });
      if (result.success) {
        setSuccess(result.data);
        setAppointmentTime('');
        setReasonForVisit('');
        const refreshed = await getAvailableAppointmentSlots(doctorId, appointmentDate);
        setSlots(refreshed.data?.slots || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to book the appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-page fade-in">
      <div className="booking-heading"><div><span>PATIENT SERVICES</span><h1>Book an Appointment</h1><p>Choose an available doctor and consultation time.</p></div><Link to="/user/dashboard">Back to dashboard</Link></div>
      <div className="booking-layout">
        <section className="booking-card glass">
          {error && <div className="booking-alert error" role="alert">{error}</div>}
          {success && <div className="booking-alert success" role="status"><strong>Appointment booked successfully.</strong><span>Your appointment is pending confirmation.</span><b>Appointment ID: {success.appointmentId}</b></div>}
          <form onSubmit={handleSubmit} className="booking-form">
            <div className="booking-step booking-wide"><span>1</span><div><h2>Choose Doctor</h2><p>Select the healthcare professional you would like to consult.</p></div></div>
            <label className="booking-wide"><span>Patient Name</span><input value={user?.fullName || ''} readOnly aria-readonly="true" /></label>
            <div className="booking-doctor-options booking-wide" role="radiogroup" aria-label="Select doctor">{loadingDoctors ? <p>Loading available doctors...</p> : doctors.map((doctor) => <button type="button" role="radio" aria-checked={doctorId === doctor._id} className={doctorId === doctor._id ? 'selected' : ''} onClick={() => { setDoctorId(doctor._id); setSuccess(null); }} key={doctor._id}>{doctor.profilePicture ? <img src={`${BACKEND_URL}${doctor.profilePicture}`} alt="" /> : <span className="booking-doctor-avatar">{doctor.fullName.slice(0,2).toUpperCase()}</span>}<span><strong>{doctor.fullName}</strong><small>{doctor.department}</small><small>{doctor.medicalLicenseNumber}</small></span>{doctorId === doctor._id && <b>✓ Selected</b>}</button>)}</div>
            <div className="booking-step booking-wide"><span>2</span><div><h2>Select Date & Time</h2><p>Only currently available consultation times can be selected.</p></div></div>
            <label><span>Specialization</span><input value={selectedDoctor?.department || ''} placeholder="Select a doctor first" readOnly aria-readonly="true" /></label>
            <label><span>Appointment Date *</span><input type="date" min={today} value={appointmentDate} onChange={(e) => { setAppointmentDate(e.target.value); setSuccess(null); }} required /></label>
            <div className="booking-wide"><span className="booking-field-label">Appointment Time *</span><div className="booking-time-slots">{loadingSlots ? <p>Loading available times...</p> : slots.length ? slots.map((slot) => <button type="button" className={appointmentTime === slot ? 'selected' : ''} aria-pressed={appointmentTime === slot} onClick={() => setAppointmentTime(slot)} key={slot}>{slot}</button>) : <p>{doctorId && appointmentDate ? 'No appointment times are available for this date.' : 'Select a doctor and date to view available times.'}</p>}</div></div>
            <div className="booking-step booking-wide"><span>3</span><div><h2>Reason for Visit</h2><p>Help the doctor prepare for your consultation.</p></div></div>
            <label className="booking-wide"><span>Reason for Visit *</span><textarea value={reasonForVisit} onChange={(e) => setReasonForVisit(e.target.value)} rows="5" maxLength="1000" placeholder="Example: Chest pain and regular checkup" required /><small>{reasonForVisit.length}/1000 characters</small></label>
            <div className="booking-review booking-wide"><span>4</span><div><h3>Review appointment</h3><p>{selectedDoctor ? `${selectedDoctor.fullName} · ${selectedDoctor.department}` : 'Choose a doctor'}<br />{appointmentDate || 'Choose a date'} · {appointmentTime || 'Choose a time'}</p></div></div>
            <div className="booking-actions booking-wide"><button type="submit" className="btn-primary" disabled={submitting || loadingSlots}>{submitting ? 'Booking appointment...' : 'Book Appointment'}</button></div>
          </form>
        </section>
        <aside className="booking-aside glass"><span>BEFORE YOU BOOK</span><h2>Appointment guidance</h2><ol><li>Select an active doctor.</li><li>Choose a current or future date.</li><li>Only available times are displayed.</li><li>New appointments require confirmation.</li></ol><div className="booking-security"><strong>Secure booking</strong><p>Your identity is taken from your signed-in account and cannot be changed here.</p></div></aside>
      </div>
    </div>
  );
}
