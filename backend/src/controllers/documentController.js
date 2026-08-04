const fs = require('fs');
const Document = require('../models/Document');
const aiService = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get all document metadata logs.
 */
const getDocuments = async (req, res, next) => {
  try {
    const docs = await Document.find().sort({ uploadDate: -1 });
    return sendSuccess(res, docs, 'Documents retrieved successfully');
  } catch (error) {
    logger.error('Failed to fetch documents', error.message);
    return sendError(res, 'Failed to fetch documents', 500, error.message);
  }
};

/**
 * Delete a specific document by its MongoDB ID.
 */
const deleteDocument = async (req, res, next) => {
  const { id } = req.params;
  
  try {
    // Find document by MongoDB ObjectId or CustomId
    const doc = await Document.findOne({
      $or: [
        { _id: Object.isValidObjectId ? (mongoose.Types.ObjectId.isValid(id) ? id : null) : null },
        { customId: id }
      ].filter(cond => cond !== null)
    });

    // If mongoose.Types is not imported, let's just do a direct check or regular find
    // To be perfectly robust without importing mongoose, let's find by Mongoose ID or customId
    // Let's implement it carefully
    let document = await Document.findById(id);
    if (!document) {
      document = await Document.findOne({ customId: id });
    }

    if (!document) {
      return sendError(res, 'Document not found', 404);
    }

    const { customId, filePath, filename } = document;
    logger.info(`Deleting document: ${filename} (ID: ${customId})`);

    // 1. Delete embeddings from AI Service Vector Database
    try {
      await aiService.deleteDocument(customId);
      logger.info(`Embeddings deleted for document ${customId}`);
    } catch (aiErr) {
      logger.warn(`AI Service deletion error for ${customId}: ${aiErr.message}`);
      // Continue anyway so system doesn't block local disk/metadata cleanup
    }

    // 2. Remove local PDF file from local disk
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        logger.info(`Local file deleted: ${filePath}`);
      } catch (unlinkErr) {
        logger.error(`Error deleting local file ${filePath}: ${unlinkErr.message}`);
      }
    }

    // 3. Remove metadata from MongoDB
    await Document.deleteOne({ _id: document._id });

    return sendSuccess(res, null, `Document "${filename}" and its embeddings deleted successfully`);
  } catch (error) {
    logger.error(`Failed to delete document ${id}`, error.message);
    return sendError(res, 'Failed to delete document', 500, error.message);
  }
};

/**
 * Trigger embeddings rebuild for a single document.
 */
const rebuildDocumentEmbeddings = async (req, res, next) => {
  const { id } = req.params;

  try {
    let document = await Document.findById(id);
    if (!document) {
      document = await Document.findOne({ customId: id });
    }

    if (!document) {
      return sendError(res, 'Document not found to rebuild', 404);
    }

    logger.info(`Rebuilding embeddings for: ${document.filename} (${document.customId})`);
    
    // Call Python FastAPI
    const result = await aiService.rebuildDocument(document.customId);
    
    return sendSuccess(res, result, `Embeddings rebuilt successfully for document: ${document.filename}`);
  } catch (error) {
    logger.error(`Failed to rebuild embeddings for document ${id}`, error.message);
    return sendError(res, 'Failed to rebuild embeddings', 500, error.message);
  }
};

/**
 * Trigger embeddings rebuild for all documents.
 */
const rebuildAllEmbeddings = async (req, res, next) => {
  try {
    logger.info(`Rebuilding embeddings for all uploaded documents`);
    
    // Call Python FastAPI
    const result = await aiService.rebuildAllDocuments();
    
    return sendSuccess(res, result, `Embeddings rebuilt successfully for all documents`);
  } catch (error) {
    logger.error(`Failed to rebuild all embeddings`, error.message);
    return sendError(res, 'Failed to rebuild all embeddings', 500, error.message);
  }
};

module.exports = {
  getDocuments,
  deleteDocument,
  rebuildDocumentEmbeddings,
  rebuildAllEmbeddings
};
