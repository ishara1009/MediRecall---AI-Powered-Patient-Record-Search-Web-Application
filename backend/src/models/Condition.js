const mongoose = require('mongoose');
const ConditionSchema = new mongoose.Schema({
  conditionId: { type: String, required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  conditionName: { type: String, required: true, trim: true },
  diagnosisDate: { type: Date, default: null },
  status: { type: String, enum: ['Active', 'Resolved', 'Chronic', 'Under Investigation'], default: 'Active' },
  severity: { type: String, enum: ['Mild', 'Moderate', 'Severe', 'Unspecified'], default: 'Unspecified' },
  diagnosedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clinicalNotes: { type: String, trim: true, maxlength: 3000, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('Condition', ConditionSchema);
