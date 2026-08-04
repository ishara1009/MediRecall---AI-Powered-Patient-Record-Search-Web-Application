const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const chatController = require('../controllers/chatController');

router.post(
  '/chat',
  [
    body('question')
      .trim()
      .notEmpty()
      .withMessage('Question query text is required')
      .isString()
  ],
  chatController.queryChat
);

module.exports = router;
