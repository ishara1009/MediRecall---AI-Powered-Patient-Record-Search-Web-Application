const mongoose = require('mongoose');
const DoctorLeaveSchema = new mongoose.Schema({
  leaveId: { type: String, required: true, unique: true, trim: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  startDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  endDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  reason: { type: String, required: true, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending', index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  reviewNote: { type: String, trim: true, maxlength: 1000, default: '' }
}, { timestamps: true });
DoctorLeaveSchema.index({ doctor: 1, startDate: 1, endDate: 1 });
module.exports = mongoose.model('DoctorLeave', DoctorLeaveSchema);
