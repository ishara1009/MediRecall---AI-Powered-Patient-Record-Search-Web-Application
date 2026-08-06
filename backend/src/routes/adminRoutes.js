const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const uploadImage = require('../middleware/uploadImage');

// Apply protection globally to all admin routes
router.use(protect);
router.use(authorize('Admin'));

// Manage Doctor accounts
router.post('/doctors', uploadImage.single('profilePicture'), adminController.createDoctor);
router.get('/doctors', adminController.getDoctors);
router.put('/doctors/:id', uploadImage.single('profilePicture'), adminController.updateDoctor);
router.delete('/doctors/:id', adminController.deleteDoctor);
router.patch('/doctors/:id/status', adminController.toggleDoctorStatus);
router.post('/doctors/:id/reset-password', adminController.resetDoctorPassword);

// Manage system statistics
router.get('/stats', adminController.getStats);

// View system logs
router.get('/logs', adminController.getLogs);

module.exports = router;
