const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');
const { getAvailabilitySummary } = require('../services/availabilityService');

const publicDoctorFields = 'employeeId fullName department departmentRef specialization floor roomNumber clinicLocation doctorInformation medicalLicenseNumber profilePicture status';

const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'Doctor', status: 'active' })
      .select(publicDoctorFields)
      .sort({ fullName: 1 })
      .lean();
    const data = await Promise.all(doctors.map(async (doctor) => ({ ...doctor, availability: await getAvailabilitySummary(doctor) })));
    return sendSuccess(res, data, 'Healthcare professionals retrieved successfully');
  } catch (error) {
    return sendError(res, 'Unable to retrieve healthcare professionals', 500, error.message);
  }
};

const getDoctor = async (req, res) => {
  try {
    const doctor = await User.findOne({ role: 'Doctor', status: 'active', employeeId: req.params.doctorId.toUpperCase() })
      .select(publicDoctorFields)
      .lean();
    if (!doctor) return sendError(res, 'Healthcare professional not found', 404);
    return sendSuccess(res, { ...doctor, availability: await getAvailabilitySummary(doctor) }, 'Healthcare professional retrieved successfully');
  } catch (error) {
    return sendError(res, 'Unable to retrieve healthcare professional', 500, error.message);
  }
};

module.exports = { getDoctors, getDoctor };
