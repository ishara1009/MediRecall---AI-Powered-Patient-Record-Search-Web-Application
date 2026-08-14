const mongoose = require('mongoose');
const MedicationSchema = new mongoose.Schema({
  medicationId: { type: String, required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  medicationName: { type: String, required: true, trim: true },
  dosage: { type: String, required: true, trim: true },
  frequency: { type: String, required: true, trim: true },
  route: { type: String, trim: true, default: '' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, default: null },
  status: { type: String, enum: ['Active', 'Completed', 'Discontinued'], default: 'Active' },
  instructions: { type: String, trim: true, maxlength: 2000, default: '' },
  prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
module.exports = mongoose.model('Medication', MedicationSchema);
