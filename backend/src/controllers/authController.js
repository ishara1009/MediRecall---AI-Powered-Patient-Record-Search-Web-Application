const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');
const { logAuditEvent } = require('../utils/auditLogger');
const { ensurePatientForUser } = require('../services/patientService');

const JWT_SECRET = process.env.JWT_SECRET || 'medirecall_super_secret_key_12345!';

const normalizePhoneNumber = (phoneNumber = '') => String(phoneNumber).replace(/[\s()-]/g, '').replace(/^\+/, '');

const isValidPhoneNumber = (phoneNumber = '') => /^\d{7,15}$/.test(normalizePhoneNumber(phoneNumber));

/**
 * Validate password strength against policy
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const validatePasswordPolicy = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one numeric digit';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
  return null;
};

/**
 * Check if the first application administrator account exists
 */
const setupStatus = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'Admin' });
    return sendSuccess(res, { adminExists: adminCount > 0 }, 'Setup status fetched successfully');
  } catch (error) {
    return sendError(res, 'Failed to fetch setup status', 500, error.message);
  }
};

/**
 * Create the first administrator account (system setup)
 */
const setupAdmin = async (req, res) => {
  try {
    // 1. Verify if an administrator already exists
    const adminExists = await User.findOne({ role: 'Admin' });
    if (adminExists) {
      return sendError(res, 'Administrator setup is permanently closed. Accounts exist.', 400);
    }

    const { fullName, email, phoneNumber, employeeId, password, confirmPassword } = req.body;

    // 2. Base validations
    if (!fullName || !email || !phoneNumber || !employeeId || !password) {
      return sendError(res, 'All fields are required', 400);
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 'Invalid email address format', 400);
    }

    // Phone number format validation
    if (!isValidPhoneNumber(phoneNumber)) {
      return sendError(res, 'Invalid phone number format', 400);
    }

    // Password confirmation
    if (password !== confirmPassword) {
      return sendError(res, 'Passwords do not match', 400);
    }

    // Password policy check
    const policyResult = validatePasswordPolicy(password);
    if (policyResult) {
      return sendError(res, policyResult, 400);
    }

    // Check for duplicate Email and Employee ID
    const duplicateEmail = await User.findOne({ email });
    if (duplicateEmail) {
      return sendError(res, 'An account with this email address already exists', 400);
    }

    const duplicateEmployee = await User.findOne({ employeeId });
    if (duplicateEmployee) {
      return sendError(res, 'An account with this Employee ID already exists', 400);
    }

    // Check if an avatar was uploaded
    let profilePicture = '';
    if (req.file) {
      profilePicture = `/uploads/${req.file.filename}`;
    }

    // 3. Create Admin record
    const admin = new User({
      fullName,
      email,
      phoneNumber,
      employeeId,
      password, // Hashed in pre-save hook
      role: 'Admin',
      status: 'active',
      profilePicture,
      isFirstLogin: false // Admin is set up directly, first login forced reset not required
    });

    await admin.save();

    await logAuditEvent(
      req,
      admin._id,
      admin.fullName,
      admin.role,
      'SETUP_ADMIN',
      `First administrator account registered for employee ID ${employeeId}`
    );

    return sendSuccess(res, null, 'Administrator registered successfully. Proceed to login.', 201);
  } catch (error) {
    console.error('SETUP_ADMIN_ERROR:', error);

    if (error?.name === 'MongooseError' || error?.message?.includes('buffering timed out') || error?.message?.includes('MongoDB connection failed')) {
      return sendError(res, 'Database unavailable. Please check the MongoDB connection and try again.', 503, error.message);
    }

    return sendError(res, 'Failed to register administrator', 500, error.message);
  }
};

/**
 * Public registration for a regular person account.
 */
const signup = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, confirmPassword } = req.body;

    if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
      return sendError(res, 'Name, email, phone number and both password fields are required', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return sendError(res, 'Invalid email address format', 400);
    }
    if (!isValidPhoneNumber(phoneNumber)) {
      return sendError(res, 'Phone number must contain 7 to 15 digits', 400);
    }
    if (password !== confirmPassword) {
      return sendError(res, 'Passwords do not match', 400);
    }
    const policyResult = validatePasswordPolicy(password);
    if (policyResult) return sendError(res, policyResult, 400);

    if (await User.exists({ email: normalizedEmail })) {
      return sendError(res, 'An account with this email address already exists', 409);
    }

    // The existing schema uses employeeId as its unique internal account number.
    let employeeId;
    do {
      employeeId = `USR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    } while (await User.exists({ employeeId }));

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phoneNumber: phoneNumber.trim(),
      employeeId,
      password,
      role: 'User',
      status: 'active',
      profilePicture: req.file ? `/uploads/${req.file.filename}` : '',
      isFirstLogin: false
    });

    await ensurePatientForUser(user);

    await logAuditEvent(req, user._id, user.fullName, user.role, 'USER_SIGNUP', 'A new personal account was registered.');
    return sendSuccess(res, null, 'Account created successfully. You can now sign in.', 201);
  } catch (error) {
    if (error?.code === 11000) {
      return sendError(res, 'An account with these details already exists', 409);
    }
    return sendError(res, 'Failed to create account', 500, error.message);
  }
};

/**
 * Public User Login (Admin and Doctor combined)
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    // 1. Fetch user by email
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'Invalid login credentials', 401);
    }

    // 2. Check status
    if (user.status === 'inactive') {
      return sendError(res, 'Your account is deactivated. Please contact an administrator.', 403);
    }

    // 3. Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid login credentials', 401);
    }

    // 4. Create stateless JWT Token valid for 8 hours
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '8h'
    });

    await logAuditEvent(
      req,
      user._id,
      user.fullName,
      user.role,
      'LOGIN_SUCCESS',
      `Successful login session opened.`
    );

    // 5. Send payload. If role is DOCTOR, flag whether it's their first login
    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          employeeId: user.employeeId,
          phoneNumber: user.phoneNumber,
          role: user.role,
          profilePicture: user.profilePicture,
          isFirstLogin: user.isFirstLogin,
          medicalLicenseNumber: user.medicalLicenseNumber,
          department: user.department
        }
      },
      'Authenticated successfully'
    );
  } catch (error) {
    return sendError(res, 'Login failed', 500, error.message);
  }
};

/**
 * Handle password reset using self-contained identity verification
 */
const forgotPassword = async (req, res) => {
  const { email, employeeId, phoneNumber, medicalLicenseNumber, newPassword, confirmNewPassword } = req.body;

  try {
    if (!email || !employeeId || !phoneNumber || !newPassword) {
      return sendError(res, 'Email, Employee ID, Phone Number and New Password are required', 400);
    }

    // 1. Fetch user by email
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'Verification failed. Provided credentials do not match our records.', 404);
    }

    // Deactivated user cannot reset password
    if (user.status === 'inactive') {
      return sendError(res, 'Disabled account. Contact system administrator.', 403);
    }

    // 2. Verify Employee ID (case-insensitive check) and Phone Number (ignore formatting)
    const cleanPhoneInput = normalizePhoneNumber(phoneNumber);
    const cleanUserPhone = normalizePhoneNumber(user.phoneNumber);

    if (
      user.employeeId.toLowerCase() !== employeeId.toLowerCase() ||
      cleanUserPhone !== cleanPhoneInput
    ) {
      return sendError(res, 'Verification failed. Provided credentials do not match our records.', 400);
    }

    // 3. For Doctors, also check Medical License Number
    if (user.role === 'Doctor') {
      if (!medicalLicenseNumber || user.medicalLicenseNumber.toLowerCase() !== medicalLicenseNumber.toLowerCase()) {
        return sendError(res, 'Verification failed. Medical license number is required for doctors.', 400);
      }
    }

    // 4. Validate password policy
    if (newPassword !== confirmNewPassword) {
      return sendError(res, 'Passwords do not match', 400);
    }

    const policyResult = validatePasswordPolicy(newPassword);
    if (policyResult) {
      return sendError(res, policyResult, 400);
    }

    // 5. Update password (will trigger pre-save hashing)
    user.password = newPassword;
    
    // If it was first login, reset this because they are changing their password here
    if (user.role === 'Doctor') {
      user.isFirstLogin = false;
    }
    
    await user.save();

    await logAuditEvent(
      req,
      user._id,
      user.fullName,
      user.role,
      'PASSWORD_RESET_SELF',
      `Password successfully reset via credential validation.`
    );

    return sendSuccess(res, null, 'Password reset successful. You can now login with your new password.');
  } catch (error) {
    return sendError(res, 'Password reset failed', 500, error.message);
  }
};

/**
 * Get current authenticated user session data
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return sendError(res, 'User session not found', 404);
    }
    return sendSuccess(res, user, 'User session retrieved successfully');
  } catch (error) {
    return sendError(res, 'Failed to retrieve session', 500, error.message);
  }
};

/**
 * Update authenticated user personal profile parameters
 */
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User profile not found', 404);
    }

    const { fullName, email, phoneNumber } = req.body;

    // Email is the immutable account identifier and cannot be changed here.
    if (email && email.trim().toLowerCase() !== user.email) {
      return sendError(res, 'Email address cannot be changed', 400);
    }

    if (fullName) {
      user.fullName = fullName;
    }

    if (phoneNumber) {
      user.phoneNumber = phoneNumber;
    }

    // Check if new avatar was uploaded
    if (req.file) {
      user.profilePicture = `/uploads/${req.file.filename}`;
    }

    // Safety: Role and Employee ID are immutable.
    // Department and Medical License cannot be edited by the Doctor.
    // The schema pre-save automatically hashes passwords, but password isn't modified here.
    await user.save();

    await logAuditEvent(
      req,
      user._id,
      user.fullName,
      user.role,
      'PROFILE_UPDATE',
      `Profile parameters updated.`
    );

    const updatedUserObj = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      employeeId: user.employeeId,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profilePicture: user.profilePicture,
      isFirstLogin: user.isFirstLogin,
      medicalLicenseNumber: user.medicalLicenseNumber,
      department: user.department
    };

    return sendSuccess(res, updatedUserObj, 'Profile updated successfully');
  } catch (error) {
    return sendError(res, 'Failed to update profile details', 500, error.message);
  }
};

/**
 * Force password change (required on first login or general change)
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return sendError(res, 'Current password and new password are required', 400);
    }

    // 1. Fetch user including his password for comparison
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User record not found', 404);
    }

    // 2. Validate current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 'Current password is incorrect', 400);
    }

    // 3. Prevent reusing same password
    if (currentPassword === newPassword) {
      return sendError(res, 'New password must be different from current password', 400);
    }

    // 4. Validate password policy
    if (newPassword !== confirmNewPassword) {
      return sendError(res, 'Passwords do not match', 400);
    }

    const policyResult = validatePasswordPolicy(newPassword);
    if (policyResult) {
      return sendError(res, policyResult, 400);
    }

    // 5. Save new password (pre-save hook hashes it)
    user.password = newPassword;
    
    // Disable first login requirement
    if (user.isFirstLogin) {
      user.isFirstLogin = false;
    }

    await user.save();

    await logAuditEvent(
      req,
      user._id,
      user.fullName,
      user.role,
      'PASSWORD_CHANGED',
      `Password successfully changed.`
    );

    return sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    return sendError(res, 'Failed to change password', 500, error.message);
  }
};

/**
 * Log user out
 */
const logout = async (req, res) => {
  try {
    if (req.user) {
      await logAuditEvent(
        req,
        req.user._id,
        req.user.fullName,
        req.user.role,
        'LOGOUT',
        `User logged out from session.`
      );
    }
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    return sendError(res, 'Logout logging failed', 500, error.message);
  }
};

module.exports = {
  setupStatus,
  setupAdmin,
  signup,
  login,
  forgotPassword,
  getMe,
  updateProfile,
  changePassword,
  logout
};
