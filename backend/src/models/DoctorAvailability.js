const mongoose = require('mongoose');
const DoctorAvailabilitySchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  dayOfWeek: { type: Number, min: 0, max: 6, required: true },
  startTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/, default: '09:00' },
  endTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/, default: '17:00' },
  slotDuration: { type: Number, enum: [15, 20, 30, 45, 60], default: 30 },
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });
DoctorAvailabilitySchema.index({ doctor: 1, dayOfWeek: 1 }, { unique: true });
module.exports = mongoose.model('DoctorAvailability', DoctorAvailabilitySchema);
