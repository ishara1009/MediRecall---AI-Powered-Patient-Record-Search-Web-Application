const User = require('../models/User');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const ChatHistory = require('../models/ChatHistory');
const { sendSuccess, sendError } = require('../utils/response');
const { logAuditEvent } = require('../utils/auditLogger');
const bcrypt = require('bcryptjs');

const normalizePhoneNumber = (phoneNumber = '') => String(phoneNumber).replace(/[\s()-]/g, '').replace(/^\+/, '');

const isValidPhoneNumber = (phoneNumber = '') => /^\d{7,15}$/.test(normalizePhoneNumber(phoneNumber));

/**
 * Register a Doctor account (Admin only action)
 */
const createDoctor = async (req, res) => {
  const {
    fullName,
    medicalLicenseNumber,
    employeeId,
    department,
    doctorInformation,
    email,
    phoneNumber,
    temporaryPassword
  } = req.body;

  try {
    // 1. Inputs validation
    if (
      !fullName ||
      !medicalLicenseNumber ||
      !employeeId ||
      !department ||
      !email ||
      !phoneNumber ||
      !temporaryPassword
    ) {
      return sendError(res, 'All fields are required', 400);
    }

    // Email format checks
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 'Invalid email address format', 400);
    }

    // Phone format checks
    if (!isValidPhoneNumber(phoneNumber)) {
      return sendError(res, 'Invalid phone number format', 400);
    }

    // Password policy check
    if (temporaryPassword.length < 8) {
      return sendError(res, 'Temporary password must be at least 8 characters long', 400);
    }

    // 2. Duplicate validation
    const duplicateEmail = await User.findOne({ email });
    if (duplicateEmail) {
      return sendError(res, 'A user with this email address already exists', 400);
    }

    const normalizedDoctorId = employeeId.trim().toUpperCase();
    if (!/^DOC-[A-Z0-9-]+$/.test(normalizedDoctorId)) {
      return sendError(res, 'Doctor ID must start with DOC- and contain only letters, numbers or hyphens', 400);
    }

    const duplicateEmployee = await User.findOne({ employeeId: normalizedDoctorId });
    if (duplicateEmployee) {
      return sendError(res, 'A user with this Doctor ID already exists', 400);
    }

    const duplicateLicense = await User.findOne({ medicalLicenseNumber });
    if (duplicateLicense) {
      return sendError(res, 'A user with this Medical License Number already exists', 400);
    }

    // Profile photo upload check
    let profilePicture = '';
    if (req.file) {
      profilePicture = `/uploads/${req.file.filename}`;
    }

    // 3. Create Doctor, default: isFirstLogin is true
    const doctor = new User({
      fullName,
      medicalLicenseNumber,
      employeeId: normalizedDoctorId,
      department,
      doctorInformation: doctorInformation ? doctorInformation.trim() : '',
      email,
      phoneNumber,
      password: temporaryPassword, // Hashed in pre-save hooks
      role: 'Doctor',
      status: 'active',
      profilePicture,
      isFirstLogin: true
    });

    await doctor.save();

    await logAuditEvent(
      req,
      req.user.id,
      req.user.fullName,
      req.user.role,
      'CREATE_DOCTOR',
      `Registered doctor account: "${fullName}" (ID: ${normalizedDoctorId}, License: ${medicalLicenseNumber})`
    );

    const safeDoctor = doctor.toObject();
    delete safeDoctor.password;
    return sendSuccess(res, safeDoctor, 'Doctor account created successfully', 201);
  } catch (error) {
    return sendError(res, 'Failed to create Doctor account', 500, error.message);
  }
};

/**
 * List all doctor accounts
 */
const getDoctors = async (req, res) => {
  try {
    // Return all doctors sorted by newest
    const doctors = await User.find({ role: 'Doctor' }).select('-password').sort({ createdAt: -1 });
    return sendSuccess(res, doctors, 'Doctors retrieved successfully');
  } catch (error) {
    return sendError(res, 'Failed to fetch doctors', 500, error.message);
  }
};

/**
 * Update doctor account parameters (Admin only action)
 */
const updateDoctor = async (req, res) => {
  const { id } = req.params;
  const { fullName, medicalLicenseNumber, department, doctorInformation, email, phoneNumber } = req.body;

  try {
    const doctor = await User.findOne({ _id: id, role: 'Doctor' });
    if (!doctor) {
      return sendError(res, 'Doctor account not found', 404);
    }

    // Validations
    if (email && email !== doctor.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return sendError(res, 'Invalid email address format', 400);
      }
      
      const duplicateEmail = await User.findOne({ email });
      if (duplicateEmail) {
        return sendError(res, 'A user with this email address already exists', 400);
      }
      doctor.email = email;
    }

    if (medicalLicenseNumber && medicalLicenseNumber !== doctor.medicalLicenseNumber) {
      const duplicateLicense = await User.findOne({ medicalLicenseNumber });
      if (duplicateLicense) {
        return sendError(res, 'A user with this Medical License Number already exists', 400);
      }
      doctor.medicalLicenseNumber = medicalLicenseNumber;
    }

    if (fullName) doctor.fullName = fullName;
    if (department) doctor.department = department;
    if (doctorInformation !== undefined) doctor.doctorInformation = doctorInformation.trim();
    
    if (phoneNumber) {
      if (!isValidPhoneNumber(phoneNumber)) {
        return sendError(res, 'Invalid phone number format', 400);
      }
      doctor.phoneNumber = phoneNumber;
    }

    if (req.file) {
      doctor.profilePicture = `/uploads/${req.file.filename}`;
    }

    await doctor.save();

    await logAuditEvent(
      req,
      req.user.id,
      req.user.fullName,
      req.user.role,
      'UPDATE_DOCTOR',
      `Modified doctor parameters for: "${doctor.fullName}" (ID: ${doctor.employeeId})`
    );

    const safeDoctor = doctor.toObject();
    delete safeDoctor.password;
    return sendSuccess(res, safeDoctor, 'Doctor account updated successfully');
  } catch (error) {
    return sendError(res, 'Failed to update doctor account', 500, error.message);
  }
};

/**
 * Delete a Doctor account (Admin only action)
 */
const deleteDoctor = async (req, res) => {
  const { id } = req.params;

  try {
    const doctor = await User.findOne({ _id: id, role: 'Doctor' });
    if (!doctor) {
      return sendError(res, 'Doctor account not found', 404);
    }

    const doctorName = doctor.fullName;
    const employeeId = doctor.employeeId;

    await User.deleteOne({ _id: id });

    // Clean up related chat and search history
    await ChatHistory.deleteMany({ doctorId: id });
    const SearchHistory = require('../models/SearchHistory');
    await SearchHistory.deleteMany({ doctorId: id });

    await logAuditEvent(
      req,
      req.user.id,
      req.user.fullName,
      req.user.role,
      'DELETE_DOCTOR',
      `Deleted doctor account: "${doctorName}" (ID: ${employeeId})`
    );

    return sendSuccess(res, null, `Doctor "${doctorName}" deleted successfully`);
  } catch (error) {
    return sendError(res, 'Failed to delete doctor account', 500, error.message);
  }
};

/**
 * Toggle Doctor Active status (Admin only action)
 */
const toggleDoctorStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' or 'inactive'

  try {
    if (!['active', 'inactive'].includes(status)) {
      return sendError(res, 'Invalid status parameter. Must be "active" or "inactive".', 400);
    }

    const doctor = await User.findOne({ _id: id, role: 'Doctor' });
    if (!doctor) {
      return sendError(res, 'Doctor account not found', 404);
    }

    doctor.status = status;
    await doctor.save();

    const actionText = status === 'active' ? 'ACTIVATED_DOCTOR' : 'DEACTIVATED_DOCTOR';
    await logAuditEvent(
      req,
      req.user.id,
      req.user.fullName,
      req.user.role,
      actionText,
      `Toggled status of doctor "${doctor.fullName}" (ID: ${doctor.employeeId}) to "${status}"`
    );

    return sendSuccess(res, doctor, `Doctor account status has been changed to "${status}" successfully`);
  } catch (error) {
    return sendError(res, 'Failed to toggle status', 500, error.message);
  }
};

/**
 * Force password reset by Admin (gives Doctor a new temporary password and resets isFirstLogin)
 */
const resetDoctorPassword = async (req, res) => {
  const { id } = req.params;
  const { temporaryPassword } = req.body;

  try {
    if (!temporaryPassword || temporaryPassword.length < 8) {
      return sendError(res, 'Temporary password parameter is required and must be at least 8 characters long', 400);
    }

    const doctor = await User.findOne({ _id: id, role: 'Doctor' });
    if (!doctor) {
      return sendError(res, 'Doctor account not found', 404);
    }

    // Force isFirstLogin back to true so doctor MUST change password upon next signin
    doctor.password = temporaryPassword;
    doctor.isFirstLogin = true;
    await doctor.save();

    await logAuditEvent(
      req,
      req.user.id,
      req.user.fullName,
      req.user.role,
      'RESET_DOCTOR_PASSWORD_ADMIN',
      `Admin hard-reset password of doctor "${doctor.fullName}" (ID: ${doctor.employeeId}) to a new temporary credential.`
    );

    return sendSuccess(res, null, `Password for Doctor "${doctor.fullName}" reset successful.`);
  } catch (error) {
    return sendError(res, 'Failed to reset password', 500, error.message);
  }
};

/**
 * View core system stats (Admin dashboard)
 */
const getStats = async (req, res) => {
  try {
    const totalDoctors = await User.countDocuments({ role: 'Doctor' });
    const activeDoctors = await User.countDocuments({ role: 'Doctor', status: 'active' });
    const inactiveDoctors = await User.countDocuments({ role: 'Doctor', status: 'inactive' });
    
    // Patient records maps to documents
    const totalPatientRecords = await Document.countDocuments({});

    // Count chat sessions
    const totalChats = await ChatHistory.countDocuments({});

    // Count system log entries
    const logEntriesCount = await AuditLog.countDocuments({});

    return sendSuccess(res, {
      doctors: {
        total: totalDoctors,
        active: activeDoctors,
        inactive: inactiveDoctors
      },
      patientRecordsCount: totalPatientRecords,
      totalChats,
      logEntriesCount
    }, 'System statistics fetched successfully');
  } catch (error) {
    return sendError(res, 'Failed to retrieve stats', 500, error.message);
  }
};

/**
 * View System logs
 */
const getLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    return sendSuccess(res, logs, 'System audit logs retrieved successfully');
  } catch (error) {
    return sendError(res, 'Failed to retrieve audit logs', 500, error.message);
  }
};

module.exports = {
  createDoctor,
  getDoctors,
  updateDoctor,
  deleteDoctor,
  toggleDoctorStatus,
  resetDoctorPassword,
  getStats,
  getLogs
};
