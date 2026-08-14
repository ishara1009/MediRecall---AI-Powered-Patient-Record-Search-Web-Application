const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

// List metadata (shared by Administrator and Doctor)
router.get('/documents', protect, authorize(['Admin', 'Doctor']), documentController.getDocuments);
router.get('/documents/:id/file', protect, authorize(['Admin', 'Doctor']), documentController.viewDocument);

// Delete metadata + index (Admin only)
router.delete('/documents/:id', protect, authorize('Admin'), documentController.deleteDocument);
router.put('/documents/:id/patient', protect, authorize('Admin'), upload.fields([
  { name: 'patientPhoto', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]), documentController.updateDocumentPatient);

// Rebuild index for single doc (Admin only)
router.post('/documents/:id/rebuild', protect, authorize('Admin'), documentController.rebuildDocumentEmbeddings);

// Rebuild index for all docs (Admin only)
router.post('/documents/rebuild-all', protect, authorize('Admin'), documentController.rebuildAllEmbeddings);

module.exports = router;
