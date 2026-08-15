const mongoose = require('mongoose');

const LabResultSchema = new mongoose.Schema({
  labResultId: { type: String, required: true, unique: true, trim: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  testName: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true },
  numericValue: { type: Number, default: null },
  unit: { type: String, trim: true, default: '' },
  referenceRange: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['Normal', 'Low', 'High', 'Critical', 'Abnormal', 'Pending'], default: 'Pending' },
  testDate: { type: Date, required: true },
  sourceDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

LabResultSchema.index({ patient: 1, testName: 1, testDate: -1 });

module.exports = mongoose.model('LabResult', LabResultSchema);
