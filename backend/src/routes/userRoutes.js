const express = require('express');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.use(authorize('User'));
router.get('/doctors', userController.getDoctors);

module.exports = router;
