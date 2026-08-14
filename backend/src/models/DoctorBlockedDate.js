const mongoose = require('mongoose');
const DoctorBlockedDateSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  reason: { type: String, trim: true, maxlength: 500, default: '' }
}, { timestamps: true });
DoctorBlockedDateSchema.index({ doctor: 1, date: 1 }, { unique: true });
module.exports = mongoose.model('DoctorBlockedDate', DoctorBlockedDateSchema);
