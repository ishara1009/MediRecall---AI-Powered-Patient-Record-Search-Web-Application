const { validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../utils/logger');
const Patient = require('../models/Patient');
const Document = require('../models/Document');
const { logAuditEvent } = require('../utils/auditLogger');

const queryChat = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }

  const { question, documentId, patientId } = req.body;

  try {
    const patient = await Patient.findOne({ patientId: String(patientId || '').toUpperCase() });
    if (!patient) return sendError(res, 'Select a valid patient before using the clinical assistant', 400);
    let document = null;
    if (documentId) {
      document = await Document.findOne({ customId: documentId, patient: patient._id, processingStatus: 'READY' });
      if (!document) return sendError(res, 'Document is not ready or does not belong to the selected patient', 403);
    }
    const readyCount = await Document.countDocuments({ patient: patient._id, processingStatus: 'READY' });
    if (!readyCount) return sendError(res, 'No ready medical documents are available for this patient', 400);
    logger.info(`Sending patient-scoped question to AI RAG service for ${patient.patientId}`);
    
    // Call AI Service /chat
    const result = await aiService.queryChat(question, patient.patientId, documentId);
    await logAuditEvent(req, req.user._id, req.user.fullName, req.user.role, 'AI_QUERY', `Patient ${patient.patientId}; documents accessed: ${result.documents_used || 0}; result: ${result.evidence_coverage || 'Unknown'}.`);
    
    // Express returns success response
    return sendSuccess(res, result, 'Answer generated successfully');
  } catch (error) {
    logger.error('Chat response generation failed', error.message);
    return sendError(res, 'Failed to retrieve answer from AI service', 500, error.message);
  }
};

module.exports = {
  queryChat
};
