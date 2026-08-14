const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const DoctorAvailability = require('../models/DoctorAvailability');
const DoctorBlockedDate = require('../models/DoctorBlockedDate');
const { sendSuccess, sendError } = require('../utils/response');
const { logAuditEvent } = require('../utils/auditLogger');
const { createNotification } = require('../services/notificationService');

const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user._id }).populate('patient', 'fullName email phoneNumber').sort({ appointmentDate: 1, appointmentTime: 1 }).lean();
    const accounts = appointments.map((x) => x.patient?._id).filter(Boolean);
    const patients = await Patient.find({ account: { $in: accounts } }).select('account patientId').lean();
    const ids = new Map(patients.map((p) => [String(p.account), p.patientId]));
    return sendSuccess(res, appointments.map((x) => ({ ...x, patientId: ids.get(String(x.patient?._id)), patientName: x.patient?.fullName })), 'Doctor appointments retrieved successfully');
  } catch (error) { return sendError(res, 'Failed to retrieve appointments', 500, error.message); }
};

const updateStatus = async (req, res) => {
  try {
    const transitions = {
      Pending: ['Confirmed', 'Rejected', 'Reschedule Requested'],
      Confirmed: ['Completed', 'No Show', 'Cancelled', 'Reschedule Requested'],
      'Reschedule Requested': ['Confirmed', 'Rejected'],
      Rejected: [], Completed: [], Cancelled: [], 'No Show': []
    };
    const appointment = await Appointment.findOne({ _id: req.params.id, doctor: req.user._id });
    if (!appointment) return sendError(res, 'Appointment is not assigned to this doctor', 404);
    const nextStatus = req.body.status;
    if (!transitions[appointment.status]?.includes(nextStatus)) return sendError(res, `Cannot change ${appointment.status} appointment to ${nextStatus}`, 400);
    appointment.status = nextStatus;
    if (['Rejected', 'Cancelled'].includes(nextStatus)) appointment.slotKey = undefined;
    await appointment.save();
    await logAuditEvent(req, req.user._id, req.user.fullName, req.user.role, `APPOINTMENT_${nextStatus.toUpperCase().replace(/ /g, '_')}`, `${appointment.appointmentId} changed to ${nextStatus}.`);
    const typeMap = { Confirmed: 'APPOINTMENT_CONFIRMED', Rejected: 'APPOINTMENT_REJECTED', 'Reschedule Requested': 'APPOINTMENT_RESCHEDULED', Completed: 'APPOINTMENT_COMPLETED', Cancelled: 'APPOINTMENT_CANCELLED' };
    if (typeMap[nextStatus]) await createNotification({ recipient: appointment.patient, type: typeMap[nextStatus], title: `Appointment ${nextStatus.toLowerCase()}`, message: `${appointment.appointmentId} has been updated to ${nextStatus}.`, resourceKind: 'Appointment', resourceId: appointment._id, emailTemplate: `appointment-${nextStatus.toLowerCase().replace(/ /g,'-')}` });
    return sendSuccess(res, appointment, `Appointment marked as ${nextStatus}`);
  } catch (error) { return sendError(res, 'Failed to update appointment', 500, error.message); }
};

const getAvailability = async (req, res) => {
  try {
    const [schedule, blockedDates] = await Promise.all([DoctorAvailability.find({ doctor: req.user._id }).sort({ dayOfWeek: 1 }), DoctorBlockedDate.find({ doctor: req.user._id }).sort({ date: 1 })]);
    return sendSuccess(res, { schedule, blockedDates }, 'Availability retrieved successfully');
  } catch (error) { return sendError(res, 'Failed to retrieve availability', 500, error.message); }
};

const saveAvailability = async (req, res) => {
  try {
    const entries = req.body.schedule;
    if (!Array.isArray(entries)) return sendError(res, 'Schedule must be an array', 400);
    for (const item of entries) {
      if (item.startTime >= item.endTime && item.isAvailable) return sendError(res, 'Schedule end time must be after start time', 400);
      await DoctorAvailability.findOneAndUpdate({ doctor: req.user._id, dayOfWeek: item.dayOfWeek }, { ...item, doctor: req.user._id }, { upsert: true, new: true, runValidators: true });
    }
    return getAvailability(req, res);
  } catch (error) { return sendError(res, 'Failed to save availability', 500, error.message); }
};

const addBlockedDate = async (req, res) => {
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.date || '')) return sendError(res, 'Valid blocked date is required', 400);
    const blocked = await DoctorBlockedDate.findOneAndUpdate({ doctor: req.user._id, date: req.body.date }, { doctor: req.user._id, date: req.body.date, reason: req.body.reason || '' }, { upsert: true, new: true, runValidators: true });
    return sendSuccess(res, blocked, 'Blocked date saved successfully', 201);
  } catch (error) { return sendError(res, 'Failed to block date', 500, error.message); }
};

const deleteBlockedDate = async (req, res) => {
  try { await DoctorBlockedDate.deleteOne({ _id: req.params.id, doctor: req.user._id }); return sendSuccess(res, null, 'Blocked date removed successfully'); }
  catch (error) { return sendError(res, 'Failed to remove blocked date', 500, error.message); }
};

module.exports = { getAppointments, updateStatus, getAvailability, saveAvailability, addBlockedDate, deleteBlockedDate };
