const express = require('express');
const userController = require('../controllers/userController');
const appointmentController = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.use(authorize('User'));
router.get('/doctors', userController.getDoctors);
router.get('/doctors/:doctorId', userController.getDoctor);
router.get('/appointments/available-slots', appointmentController.getAvailableSlots);
router.get('/appointments', appointmentController.getMyAppointments);
router.post('/appointments', appointmentController.createAppointment);
router.patch('/appointments/:id/cancel', appointmentController.cancelAppointment);

module.exports = router;
