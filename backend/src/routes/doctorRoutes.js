const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const patientController = require('../controllers/patientController');
const doctorAppointmentController = require('../controllers/doctorAppointmentController');
const { protect, authorize } = require('../middleware/auth');

// Apply protection globally to all Doctor routes
router.use(protect);
router.use(authorize('Doctor'));

// Search logger endpoints
router.post('/search-history', doctorController.saveSearchQuery);
router.get('/search-history', doctorController.getSearchHistory);

// Chat sessions endpoints
router.get('/chat-sessions', doctorController.getChatSessions);
router.post('/chat-sessions', doctorController.createChatSession);
router.get('/chat-sessions/:id', doctorController.getChatSessionDetails);
router.post('/chat-sessions/:id/messages', doctorController.addMessageToSession);
router.delete('/chat-sessions/:id', doctorController.deleteChatSession);

// Stats endpoint
router.get('/stats', doctorController.getDoctorStats);
router.get('/patients', patientController.listPatients);
router.get('/patients/:patientId', patientController.getPatientWorkspace);
router.post('/patients/:patientId/conditions', patientController.addCondition);
router.patch('/patients/:patientId/conditions/:id', patientController.updateCondition);
router.post('/patients/:patientId/allergies', patientController.addAllergy);
router.patch('/patients/:patientId/allergies/:id', patientController.updateAllergy);
router.post('/patients/:patientId/medications', patientController.addMedication);
router.patch('/patients/:patientId/medications/:id', patientController.updateMedication);
router.post('/patients/:patientId/consultations', patientController.addConsultation);
router.patch('/patients/:patientId/consultations/:id', patientController.updateConsultation);
router.post('/patients/:patientId/lab-results', patientController.addLabResult);
router.patch('/patients/:patientId/lab-results/:id', patientController.updateLabResult);
router.get('/appointments', doctorAppointmentController.getAppointments);
router.patch('/appointments/:id/status', doctorAppointmentController.updateStatus);
router.get('/availability', doctorAppointmentController.getAvailability);
router.put('/availability', doctorAppointmentController.saveAvailability);
router.post('/availability/blocked-dates', doctorAppointmentController.addBlockedDate);
router.delete('/availability/blocked-dates/:id', doctorAppointmentController.deleteBlockedDate);

module.exports = router;
