const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  customId: {
    type: String,
    required: true,
    unique: true
  },
  filename: {
    type: String,
    required: true
  },
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
