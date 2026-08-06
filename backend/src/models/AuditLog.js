const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  actorName: {
    type: String,
    required: true,
    default: 'System'
  },
  actorRole: {
    type: String,
    required: true,
    default: 'System'
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
