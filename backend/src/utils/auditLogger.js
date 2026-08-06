const AuditLog = require('../models/AuditLog');

/**
 * Log a system operation or security event to MongoDB AuditLogs
 */
const logAuditEvent = async (req, userId, actorName, actorRole, action, details) => {
  try {
    const ipAddress = req ? (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') : 'System';
    await AuditLog.create({
      userId,
      actorName: actorName || 'System',
      actorRole: actorRole || 'System',
      action,
      details,
      ipAddress
    });
  } catch (err) {
    console.error('Failed to log audit event:', err.message);
  }
};

module.exports = { logAuditEvent };
