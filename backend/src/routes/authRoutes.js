const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const uploadImage = require('../middleware/uploadImage');

// Setup status check
router.get('/setup-status', authController.setupStatus);

// First admin setup
router.post('/setup-admin', uploadImage.single('profilePicture'), authController.setupAdmin);

// Public registration for people using MediRecall
router.post('/signup', uploadImage.single('profilePicture'), authController.signup);

// Standard Login
router.post('/login', authController.login);

// Self-contained identity verified Forgot Password reset
router.post('/forgot-password', authController.forgotPassword);

// Get currently authenticated session user profile
router.get('/me', protect, authController.getMe);

// Update details inside user profile
router.put('/profile', protect, uploadImage.single('profilePicture'), authController.updateProfile);

// Change active user password (regular or forced reset)
router.put('/change-password', protect, authController.changePassword);

// Active logout log
router.post('/logout', protect, authController.logout);

module.exports = router;
