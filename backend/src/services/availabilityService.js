const DoctorAvailability = require('../models/DoctorAvailability');
const DoctorBlockedDate = require('../models/DoctorBlockedDate');
const DoctorLeave = require('../models/DoctorLeave');
const Appointment = require('../models/Appointment');

const minutesFor = (time) => { const [hour, minute] = time.split(':').map(Number); return hour * 60 + minute; };
const displayTime = (minutes) => { const hour = Math.floor(minutes / 60); const minute = minutes % 60; return `${String(hour % 12 || 12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`; };
const dateString = (date = new Date()) => date.toISOString().slice(0, 10);

const getScheduleSlots = async (doctorId, date) => {
  const blocked = await DoctorBlockedDate.exists({ doctor: doctorId, date });
  const leave = await DoctorLeave.findOne({ doctor: doctorId, status: 'Approved', startDate: { $lte: date }, endDate: { $gte: date } }).lean();
  if (blocked || leave) return { slots: [], leave };
  const dayOfWeek = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  let schedule = await DoctorAvailability.findOne({ doctor: doctorId, dayOfWeek }).lean();
  if (!schedule) schedule = { startTime: '09:00', endTime: '17:00', slotDuration: 30, isAvailable: dayOfWeek >= 1 && dayOfWeek <= 5 };
  if (!schedule.isAvailable) return { slots: [], leave: null };
  const slots = []; const start = minutesFor(schedule.startTime); const end = minutesFor(schedule.endTime);
  for (let value = start; value + schedule.slotDuration <= end; value += schedule.slotDuration) slots.push(displayTime(value));
  return { slots, leave: null };
};

const getAvailabilitySummary = async (doctor, date = dateString()) => {
  if (doctor.status !== 'active') return { status: 'Inactive', date, nextAvailable: null };
  const generated = await getScheduleSlots(doctor._id, date);
  if (generated.leave) return { status: 'On Leave', date, nextAvailable: null, leaveUntil: generated.leave.endDate };
  if (!generated.slots.length) return { status: 'Unavailable Today', date, nextAvailable: null };
  const booked = await Appointment.find({ doctor: doctor._id, appointmentDate: date, status: { $nin: ['Cancelled', 'Rejected'] } }).distinct('appointmentTime');
  const available = generated.slots.filter((slot) => !booked.includes(slot));
  return { status: available.length ? 'Available' : 'Fully Booked', date, nextAvailable: available[0] || null, availableSlots: available.length };
};

module.exports = { getScheduleSlots, getAvailabilitySummary, dateString };
