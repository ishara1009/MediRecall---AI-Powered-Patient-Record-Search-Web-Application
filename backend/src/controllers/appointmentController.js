const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Counter = require('../models/Counter');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');
const { logAuditEvent } = require('../utils/auditLogger');
const DoctorAvailability = require('../models/DoctorAvailability');
const DoctorBlockedDate = require('../models/DoctorBlockedDate');
const { createNotification } = require('../services/notificationService');

const isValidDate = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
};

const todayString = () => new Date().toISOString().slice(0, 10);

const toDisplayTime = (minutes) => {
  const hour24 = Math.floor(minutes / 60); const minute = minutes % 60;
  const suffix = hour24 >= 12 ? 'PM' : 'AM'; const hour12 = hour24 % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
};
const minutesFor = (time) => { const [hour, minute] = time.split(':').map(Number); return hour * 60 + minute; };
const getGeneratedSlots = async (doctorId, date) => {
  if (await DoctorBlockedDate.exists({ doctor: doctorId, date })) return [];
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  let schedule = await DoctorAvailability.findOne({ doctor: doctorId, dayOfWeek: day }).lean();
  if (!schedule) schedule = { startTime: '09:00', endTime: '17:00', slotDuration: 30, isAvailable: day >= 1 && day <= 5 };
  if (!schedule.isAvailable) return [];
  const slots = []; const start = minutesFor(schedule.startTime); const end = minutesFor(schedule.endTime);
  for (let value = start; value + schedule.slotDuration <= end; value += schedule.slotDuration) slots.push(toDisplayTime(value));
  return slots;
};

const serializeAppointment = (appointment) => ({
  id: appointment._id,
  appointmentId: appointment.appointmentId,
  patientId: appointment.patient?.employeeId,
  patientName: appointment.patient?.fullName,
  doctorId: appointment.doctor?.employeeId,
  doctorName: appointment.doctor?.fullName,
  specialization: appointment.doctor?.department,
  appointmentDate: appointment.appointmentDate,
  appointmentTime: appointment.appointmentTime,
  reasonForVisit: appointment.reasonForVisit,
  status: appointment.status,
  createdAt: appointment.createdAt,
  updatedAt: appointment.updatedAt
});

const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!mongoose.isValidObjectId(doctorId)) return sendError(res, 'A valid doctor is required', 400);
    if (!isValidDate(date) || date < todayString()) return sendError(res, 'Select a valid current or future date', 400);

    const doctor = await User.findOne({ _id: doctorId, role: 'Doctor', status: 'active' }).select('_id');
    if (!doctor) return sendError(res, 'Selected doctor is not available', 404);

    const generated = await getGeneratedSlots(doctorId, date);
    const booked = await Appointment.find({ doctor: doctorId, appointmentDate: date, status: { $nin: ['Cancelled', 'Rejected'] } })
      .distinct('appointmentTime');
    return sendSuccess(res, { slots: generated.filter((slot) => !booked.includes(slot)) }, 'Available slots retrieved successfully');
  } catch (error) {
    return sendError(res, 'Failed to retrieve appointment times', 500, error.message);
  }
};

const createAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, reasonForVisit } = req.body;
    if (req.user.role !== 'User') return sendError(res, 'Only personal user accounts can book appointments', 403);
    if (!mongoose.isValidObjectId(doctorId)) return sendError(res, 'Please select a valid doctor', 400);
    if (!isValidDate(appointmentDate) || appointmentDate < todayString()) {
      return sendError(res, 'Appointment date must be today or a future date', 400);
    }
    const validSlots = await getGeneratedSlots(doctorId, appointmentDate);
    if (!validSlots.includes(appointmentTime)) return sendError(res, 'This time is outside the doctor’s availability', 400);

    const reason = String(reasonForVisit || '').trim();
    if (reason.length < 3) return sendError(res, 'Reason for visit must contain at least 3 characters', 400);
    if (reason.length > 1000) return sendError(res, 'Reason for visit cannot exceed 1000 characters', 400);

    const doctor = await User.findOne({ _id: doctorId, role: 'Doctor' });
    if (!doctor) return sendError(res, 'Selected doctor does not exist', 404);
    if (doctor.status !== 'active') return sendError(res, 'Selected doctor is currently unavailable', 400);

    const conflict = await Appointment.exists({
      doctor: doctor._id,
      appointmentDate,
      appointmentTime,
      status: { $nin: ['Cancelled', 'Rejected'] }
    });
    if (conflict) return sendError(res, 'This appointment time has already been booked. Please choose another time.', 409);

    const counter = await Counter.findByIdAndUpdate(
      'appointment',
      { $inc: { sequence: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const appointmentId = `APT-${String(counter.sequence).padStart(3, '0')}`;
    const appointment = await Appointment.create({
      appointmentId,
      patient: req.user._id,
      doctor: doctor._id,
      slotKey: `${doctor._id}:${appointmentDate}:${appointmentTime}`,
      appointmentDate,
      appointmentTime,
      reasonForVisit: reason,
      status: 'Pending'
    });
    await appointment.populate([
      { path: 'patient', select: 'employeeId fullName' },
      { path: 'doctor', select: 'employeeId fullName department' }
    ]);

    await logAuditEvent(req, req.user._id, req.user.fullName, req.user.role, 'CREATE_APPOINTMENT', `Booked ${appointmentId} with ${doctor.fullName}.`);
    await createNotification({ recipient: doctor._id, type: 'APPOINTMENT_CREATED', title: 'New appointment request', message: `${req.user.fullName} requested ${appointmentDate} at ${appointmentTime}.`, resourceKind: 'Appointment', resourceId: appointment._id, emailTemplate: 'appointment-created' });
    return sendSuccess(res, serializeAppointment(appointment), 'Appointment booked successfully. Your appointment is currently pending confirmation.', 201);
  } catch (error) {
    if (error?.code === 11000) return sendError(res, 'This appointment time has already been booked. Please choose another time.', 409);
    return sendError(res, 'Failed to book appointment', 500, error.message);
  }
};

const cancelAppointment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Invalid appointment identifier', 400);
    const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
    if (!appointment) return sendError(res, 'Appointment not found', 404);
    if (!['Pending', 'Confirmed'].includes(appointment.status)) {
      return sendError(res, `A ${appointment.status.toLowerCase()} appointment cannot be cancelled`, 400);
    }
    appointment.status = 'Cancelled';
    appointment.slotKey = undefined;
    await appointment.save();
    await appointment.populate([
      { path: 'patient', select: 'employeeId fullName' },
      { path: 'doctor', select: 'employeeId fullName department' }
    ]);
    await logAuditEvent(req, req.user._id, req.user.fullName, req.user.role, 'CANCEL_APPOINTMENT', `Cancelled ${appointment.appointmentId}.`);
    await createNotification({ recipient: appointment.doctor._id, type: 'APPOINTMENT_CANCELLED', title: 'Appointment cancelled', message: `${appointment.appointmentId} was cancelled by the patient.`, resourceKind: 'Appointment', resourceId: appointment._id, emailTemplate: 'appointment-cancelled' });
    return sendSuccess(res, serializeAppointment(appointment), 'Appointment cancelled successfully');
  } catch (error) {
    return sendError(res, 'Failed to cancel appointment', 500, error.message);
  }
};

const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('patient', 'employeeId fullName')
      .populate('doctor', 'employeeId fullName department')
      .sort({ appointmentDate: 1, appointmentTime: 1 });
    return sendSuccess(res, appointments.map(serializeAppointment), 'Appointments retrieved successfully');
  } catch (error) {
    return sendError(res, 'Failed to retrieve appointments', 500, error.message);
  }
};

module.exports = { getGeneratedSlots, getAvailableSlots, createAppointment, getMyAppointments, cancelAppointment };
