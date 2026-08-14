const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const chatController = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/auth');

router.post(
  '/chat',
  protect,
  authorize('Doctor'),
  [
    body('question')
      .trim()
      .notEmpty()
      .withMessage('Question query text is required')
      .isString(),
    body('documentId')
      .optional({ nullable: true })
      .trim()
      .notEmpty()
      .withMessage('Document ID cannot be empty')
      .isString(),
    body('patientId').trim().notEmpty().withMessage('Patient scope is required').isString()
  ],
  chatController.queryChat
);

module.exports = router;
