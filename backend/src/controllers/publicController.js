const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

const publicDoctorFields = 'employeeId fullName department doctorInformation medicalLicenseNumber profilePicture status';

const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'Doctor', status: 'active' })
      .select(publicDoctorFields)
      .sort({ fullName: 1 })
      .lean();
    return sendSuccess(res, doctors, 'Healthcare professionals retrieved successfully');
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
    return sendSuccess(res, doctor, 'Healthcare professional retrieved successfully');
  } catch (error) {
    return sendError(res, 'Unable to retrieve healthcare professional', 500, error.message);
  }
};

module.exports = { getDoctors, getDoctor };
