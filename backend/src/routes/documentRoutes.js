const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { protect, authorize } = require('../middleware/auth');

// List metadata (shared by Administrator and Doctor)
router.get('/documents', protect, authorize(['Admin', 'Doctor']), documentController.getDocuments);

// Delete metadata + index (Admin only)
router.delete('/documents/:id', protect, authorize('Admin'), documentController.deleteDocument);

// Rebuild index for single doc (Admin only)
router.post('/documents/:id/rebuild', protect, authorize('Admin'), documentController.rebuildDocumentEmbeddings);

// Rebuild index for all docs (Admin only)
router.post('/documents/rebuild-all', protect, authorize('Admin'), documentController.rebuildAllEmbeddings);

module.exports = router;
