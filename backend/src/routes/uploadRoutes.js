const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middleware/upload');

// Handle multiple file arrays or single files
router.post('/upload', upload.array('files', 10), uploadController.uploadDocuments);

module.exports = router;
