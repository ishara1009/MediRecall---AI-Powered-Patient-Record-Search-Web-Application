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
      .trim()
      .notEmpty()
      .withMessage('A PDF document must be selected')
      .isString()
  ],
  chatController.queryChat
);

module.exports = router;
