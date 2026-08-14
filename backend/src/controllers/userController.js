const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

/** Read-only physician directory for registered personal users. */
const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'Doctor' })
      .select('employeeId fullName email phoneNumber department doctorInformation medicalLicenseNumber profilePicture status')
      .sort({ fullName: 1 })
      .lean();
    return sendSuccess(res, doctors, 'Doctor directory retrieved successfully');
  } catch (error) {
    return sendError(res, 'Failed to fetch the doctor directory', 500, error.message);
  }
};

module.exports = { getDoctors };
