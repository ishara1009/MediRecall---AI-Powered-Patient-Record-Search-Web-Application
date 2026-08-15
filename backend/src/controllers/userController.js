const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');
const { ensurePatientForUser } = require('../services/patientService');
const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');
const { getAvailabilitySummary } = require('../services/availabilityService');
const doctorFields = 'employeeId fullName email phoneNumber department departmentRef specialization floor roomNumber clinicLocation doctorInformation medicalLicenseNumber profilePicture status';

/** Read-only physician directory for registered personal users. */
const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'Doctor', status: 'active' })
      .select(doctorFields)
      .sort({ fullName: 1 })
      .lean();
    const data = await Promise.all(doctors.map(async (doctor) => ({ ...doctor, availability: await getAvailabilitySummary(doctor) })));
    return sendSuccess(res, data, 'Doctor directory retrieved successfully');
  } catch (error) {
    return sendError(res, 'Failed to fetch the doctor directory', 500, error.message);
  }
};

const getDoctor = async (req, res) => {
  try {
    const doctor = await User.findOne({ role: 'Doctor', status: 'active', employeeId: req.params.doctorId.toUpperCase() })
      .select(doctorFields)
      .lean();
    if (!doctor) return sendError(res, 'Doctor profile not found', 404);
    return sendSuccess(res, { ...doctor, availability: await getAvailabilitySummary(doctor) }, 'Doctor profile retrieved successfully');
  } catch (error) {
    return sendError(res, 'Failed to fetch doctor profile', 500, error.message);
  }
};

const getMyRecords = async (req, res) => {
  try { const patient = await ensurePatientForUser(req.user); const records = await Document.find({ patient: patient._id, processingStatus: 'READY' }).select('-filePath').sort({ recordDate: -1 }); return sendSuccess(res, { patient, records }, 'Medical records retrieved successfully'); }
  catch (error) { return sendError(res, 'Failed to retrieve medical records', 500, error.message); }
};
const viewMyRecord = async (req, res) => {
  try { const patient = await ensurePatientForUser(req.user); const record = await Document.findOne({ customId: req.params.id, patient: patient._id, processingStatus: 'READY' }); if (!record || !fs.existsSync(record.filePath)) return sendError(res, 'Medical record not found', 404); res.setHeader('Content-Type','application/pdf'); res.setHeader('Content-Disposition',`inline; filename="${path.basename(record.filename)}"`); return res.sendFile(path.resolve(record.filePath)); }
  catch (error) { return sendError(res, 'Failed to open medical record', 500, error.message); }
};

const getPatientProfile = async (req, res) => {
  try {
    const patient = await ensurePatientForUser(req.user);
    return sendSuccess(res, patient, 'Patient profile retrieved successfully');
  } catch (error) {
    return sendError(res, 'Failed to retrieve patient profile', 500, error.message);
  }
};

const updatePatientProfile = async (req, res) => {
  try {
    const patient = await ensurePatientForUser(req.user);
    const { dateOfBirth, gender, bloodGroup } = req.body;
    if (dateOfBirth !== undefined) {
      const parsed = dateOfBirth ? new Date(dateOfBirth) : null;
      if (parsed && Number.isNaN(parsed.getTime())) return sendError(res, 'Invalid date of birth', 400);
      if (parsed && parsed > new Date()) return sendError(res, 'Date of birth cannot be in the future', 400);
      patient.dateOfBirth = parsed;
    }
    if (gender !== undefined) patient.gender = gender;
    if (bloodGroup !== undefined) patient.bloodGroup = bloodGroup;
    await patient.save();
    return sendSuccess(res, patient, 'Patient clinical profile updated successfully');
  } catch (error) {
    if (error.name === 'ValidationError') return sendError(res, 'Invalid patient profile value', 400, error.message);
    return sendError(res, 'Failed to update patient profile', 500, error.message);
  }
};

module.exports = { getDoctors, getDoctor, getMyRecords, viewMyRecord, getPatientProfile, updatePatientProfile };
