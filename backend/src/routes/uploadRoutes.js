const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

// Handle multiple file arrays or single files
router.post('/upload', protect, authorize('Admin'), upload.array('files', 10), uploadController.uploadDocuments);

module.exports = router;

