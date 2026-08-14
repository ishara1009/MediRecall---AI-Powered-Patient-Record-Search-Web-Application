const mongoose = require('mongoose');
const AllergySchema = new mongoose.Schema({
  allergyId: { type: String, required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  allergen: { type: String, required: true, trim: true },
  allergyType: { type: String, enum: ['Medication', 'Food', 'Environmental', 'Other'], default: 'Other' },
  reaction: { type: String, required: true, trim: true },
  severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'], default: 'Mild' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recordedDate: { type: Date, default: Date.now }
}, { timestamps: true });
module.exports = mongoose.model('Allergy', AllergySchema);
