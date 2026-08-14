const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true, trim: true, index: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, default: '', lowercase: true, trim: true, index: true },
  phoneNumber: { type: String, default: '', trim: true },
  dateOfBirth: { type: Date, default: null },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say', ''], default: '' },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'], default: 'Unknown' },
  profilePicture: { type: String, default: '' },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);
