const mongoose = require('mongoose');
const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['APPOINTMENT_CREATED','APPOINTMENT_CONFIRMED','APPOINTMENT_REJECTED','APPOINTMENT_RESCHEDULED','APPOINTMENT_CANCELLED','APPOINTMENT_COMPLETED','APPOINTMENT_LEAVE_AFFECTED','DOCTOR_LEAVE_REQUESTED','DOCTOR_LEAVE_APPROVED','DOCTOR_LEAVE_REJECTED','DOCUMENT_READY','SECURITY_ALERT'], required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  relatedResource: { kind: { type: String }, id: { type: mongoose.Schema.Types.ObjectId } },
  isRead: { type: Boolean, default: false, index: true }
}, { timestamps: true });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
module.exports = mongoose.model('Notification', NotificationSchema);
