const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

// List metadata
router.get('/documents', documentController.getDocuments);

// Delete metadata + index
router.delete('/documents/:id', documentController.deleteDocument);

// Rebuild index for single doc
router.post('/documents/:id/rebuild', documentController.rebuildDocumentEmbeddings);

// Rebuild index for all docs
router.post('/documents/rebuild-all', documentController.rebuildAllEmbeddings);

module.exports = router;
