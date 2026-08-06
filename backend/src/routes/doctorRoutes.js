const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
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

module.exports = router;
