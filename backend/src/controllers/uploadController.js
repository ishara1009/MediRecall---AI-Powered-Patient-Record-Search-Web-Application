const fs = require('fs');
const Document = require('../models/Document');
const aiService = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../utils/logger');
const Patient = require('../models/Patient');
const { nextId } = require('../services/patientService');

const uploadDocuments = async (req, res, next) => {
  const files = req.files?.files || [];
  const patientPhoto = req.files?.patientPhoto?.[0];
  const patientId = req.body.patientId?.trim();
  const diseases = (req.body.diseases || '').split(',').map(item => item.trim()).filter(Boolean);
  const documentType = req.body.documentType || 'OTHER';
  const recordDate = req.body.recordDate || new Date().toISOString().slice(0, 10);
  
  if (!files || files.length === 0) {
    return sendError(res, 'No PDF files provided', 400);
  }
  if (!patientId) {
    return sendError(res, 'A registered patient is required', 400);
  }

  const patient = await Patient.findOne({ patientId: patientId.toUpperCase() });
  if (!patient) return sendError(res, 'Selected patient does not exist', 404);

  const results = [];
  const errors = [];

  for (const file of files) {
    // Generate a unique ID for this document
    const customId = await nextId('medical_document', 'MED');
    
    try {
      logger.info(`Forwarding file to AI service: ${file.originalname} (ID: ${customId})`);
      
      // Upload to FastAPI AI Service
      const aiResult = await aiService.uploadDocument(file.path, file.originalname, customId, { patientId: patient.patientId, documentType, recordDate });
      
      // Save metadata to MongoDB Atlas
      const newDoc = new Document({
        customId: customId,
        patient: patient._id,
        documentType,
        recordDate,
        uploadedBy: req.user._id,
        processingStatus: 'READY',
        extractionMethod: aiResult.extraction_method || 'TEXT',
        filename: file.originalname,
        patientName: patient.fullName,
        patientId: patient.patientId,
        diseases,
        patientPhoto: patientPhoto?.filename || '',
        fileSize: file.size,
        totalPages: aiResult.total_pages || 0,
        filePath: file.path // Keep a local reference on the node system
      });
      
      const savedDoc = await newDoc.save();
      results.push(savedDoc);
      
      logger.info(`Successfully ingested and saved: ${file.originalname}`);
    } catch (err) {
      logger.error(`Failed to process PDF ${file.originalname}`, err.message);
      errors.push({
        filename: file.originalname,
        error: err.message
      });
      
      // Clean up the uploaded local file if ingestion failed
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkErr) {
          logger.error(`Failed to delete local temp file ${file.path}`, unlinkErr.message);
        }
      }
    }
  }

  if (results.length === 0) {
    return sendError(res, 'Failed to process all uploaded documents', 500, { errors });
  }

  return sendSuccess(res, {
    uploaded: results,
    failed: errors
  }, `${results.length} document(s) uploaded and ingested successfully.`);
};

module.exports = {
  uploadDocuments
};
