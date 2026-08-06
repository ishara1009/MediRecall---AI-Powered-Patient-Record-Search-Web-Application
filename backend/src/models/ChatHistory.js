const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ChatHistorySchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'New Consultation Session',
    trim: true
  },
  messages: [ChatMessageSchema],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);
