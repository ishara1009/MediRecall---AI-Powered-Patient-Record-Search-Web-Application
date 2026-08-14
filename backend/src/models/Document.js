const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', index: true, default: null },
  customId: {
    type: String,
    required: true,
    unique: true
  },
  filename: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    enum: ['LAB_REPORT', 'PRESCRIPTION', 'DISCHARGE_SUMMARY', 'CLINICAL_NOTE', 'RADIOLOGY_REPORT', 'REFERRAL', 'MEDICAL_CERTIFICATE', 'OTHER'],
    default: 'OTHER',
    index: true
  },
  recordDate: { type: Date, default: Date.now },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  processingStatus: { type: String, enum: ['UPLOADING', 'PROCESSING', 'OCR_REQUIRED', 'INDEXING', 'READY', 'FAILED'], default: 'READY', index: true },
  extractionMethod: { type: String, enum: ['TEXT', 'OCR', 'UNKNOWN'], default: 'UNKNOWN' },
  patientName: { type: String, required: true, trim: true },
  patientId: { type: String, required: true, trim: true, index: true },
  diseases: [{ type: String, trim: true }],
  patientPhoto: { type: String, default: '' },
  fileSize: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    default: 0
  },
  filePath: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Document', DocumentSchema);
