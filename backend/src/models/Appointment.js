const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  slotKey: {
    type: String,
    unique: true,
    sparse: true,
    select: false
  },
  appointmentDate: {
    type: String,
    required: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Appointment date must use YYYY-MM-DD format']
  },
  appointmentTime: {
    type: String,
    required: true,
    trim: true
  },
  reasonForVisit: {
    type: String,
    required: true,
    trim: true,
    minlength: [3, 'Reason for visit must contain at least 3 characters'],
    maxlength: [1000, 'Reason for visit cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Reschedule Requested', 'Rejected', 'Completed', 'Cancelled', 'No Show'],
    default: 'Pending'
  }
}, { timestamps: true });

AppointmentSchema.index({ doctor: 1, appointmentDate: 1, appointmentTime: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
