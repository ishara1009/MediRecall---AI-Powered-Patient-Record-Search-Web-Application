const mongoose = require('mongoose');
const ConsultationSchema = new mongoose.Schema({
  consultationId: { type: String, required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  consultationDate: { type: Date, default: Date.now },
  chiefComplaint: { type: String, required: true, trim: true, maxlength: 1500 },
  symptoms: { type: String, trim: true, maxlength: 3000, default: '' },
  clinicalFindings: { type: String, trim: true, maxlength: 4000, default: '' },
  assessment: { type: String, trim: true, maxlength: 4000, default: '' },
  treatmentPlan: { type: String, trim: true, maxlength: 4000, default: '' },
  followUpInstructions: { type: String, trim: true, maxlength: 3000, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('Consultation', ConsultationSchema);
