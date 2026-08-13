const fs = require('fs');
const Document = require('../models/Document');
const aiService = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../utils/logger');

const updateDocumentPatient = async (req, res) => {
  const newPhoto = req.files?.patientPhoto?.[0];
  const newPdf = req.files?.pdf?.[0];
  const cleanupNewFiles = () => {
    [newPhoto, newPdf].forEach(file => {
      if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    });
  };

  try {
    const patientName = req.body.patientName?.trim();
    const patientId = req.body.patientId?.trim();
    const diseases = (req.body.diseases || '').split(',').map(item => item.trim()).filter(Boolean);
    if (!patientName || !patientId || diseases.length === 0) {
      cleanupNewFiles();
      return sendError(res, 'Patient name, ID, and at least one disease or condition are required', 400);
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      cleanupNewFiles();
      return sendError(res, 'Document not found', 404);
    }

    const oldPhoto = document.patientPhoto;
    const oldPdfPath = document.filePath;

    if (newPdf) {
      try {
        await aiService.deleteDocument(document.customId);
        const aiResult = await aiService.uploadDocument(newPdf.path, newPdf.originalname, document.customId);
        document.filename = newPdf.originalname;
        document.fileSize = newPdf.size;
        document.totalPages = aiResult.total_pages || 0;
        document.filePath = newPdf.path;
      } catch (replaceError) {
        try {
          if (oldPdfPath && fs.existsSync(oldPdfPath)) {
            await aiService.uploadDocument(oldPdfPath, document.filename, document.customId);
          }
        } catch (restoreError) {
          logger.error(`Failed to restore old PDF index ${document.customId}`, restoreError.message);
        }
        cleanupNewFiles();
        return sendError(res, 'Failed to replace and index the PDF', 500, replaceError.message);
      }
    }

    document.patientName = patientName;
    document.patientId = patientId;
    document.diseases = diseases;
    if (newPhoto) document.patientPhoto = newPhoto.filename;
    const updated = await document.save();

    if (newPhoto && oldPhoto && oldPhoto !== newPhoto.filename) {
      const oldPhotoPath = require('path').join(__dirname, '../../uploads', oldPhoto);
      if (fs.existsSync(oldPhotoPath)) fs.unlinkSync(oldPhotoPath);
    }
    if (newPdf && oldPdfPath && oldPdfPath !== newPdf.path && fs.existsSync(oldPdfPath)) {
      fs.unlinkSync(oldPdfPath);
    }
    return sendSuccess(res, updated, newPdf ? 'Patient information and PDF updated successfully' : 'Patient information updated successfully');
  } catch (error) {
    cleanupNewFiles();
    logger.error(`Failed to update patient metadata ${req.params.id}`, error.message);
    return sendError(res, 'Failed to update patient information', 500, error.message);
  }
};

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
  rebuildAllEmbeddings,
  updateDocumentPatient
};
