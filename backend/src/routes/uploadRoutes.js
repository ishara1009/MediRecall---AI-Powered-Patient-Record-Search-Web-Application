const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

// Handle multiple file arrays or single files
router.post('/upload', protect, authorize('Admin'), upload.fields([
  { name: 'files', maxCount: 10 },
  { name: 'patientPhoto', maxCount: 1 }
]), uploadController.uploadDocuments);

module.exports = router;
