const { validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../utils/logger');

const queryChat = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }

  const { question, documentId } = req.body;

  try {
    logger.info(`Sending question to AI RAG service: "${question}"`);
    
    // Call AI Service /chat
    const result = await aiService.queryChat(question, documentId);
    
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
