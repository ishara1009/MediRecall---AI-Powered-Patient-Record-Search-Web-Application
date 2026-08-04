const mongoose = require('mongoose');
const aiService = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/response');

const checkHealth = async (req, res, next) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date(),
    services: {
      backend: {
        status: 'healthy',
        uptime: process.uptime()
      },
      database: {
        status: 'unknown'
      },
      aiService: {
        status: 'unknown'
      }
    }
  };

  try {
    // 1. Check MongoDB Connection status
    const dbState = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (dbState === 1) {
      healthStatus.services.database.status = 'healthy';
    } else {
      healthStatus.services.database.status = 'unhealthy';
      healthStatus.status = 'degraded';
    }

    // 2. Check Python AI Service Health
    try {
      const aiHealth = await aiService.healthCheck();
      healthStatus.services.aiService.status = 'healthy';
      healthStatus.services.aiService.details = aiHealth;
    } catch (aiErr) {
      healthStatus.services.aiService.status = 'unhealthy';
      healthStatus.services.aiService.error = aiErr.message;
      healthStatus.status = 'degraded';
    }

    return sendSuccess(res, healthStatus, 'Health status retrieved successfully');
  } catch (error) {
    return sendError(res, 'Health check failed', 500, error.message);
  }
};

module.exports = {
  checkHealth
};
