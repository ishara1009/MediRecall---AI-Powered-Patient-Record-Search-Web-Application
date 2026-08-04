const { sendError } = require('../utils/response');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`Unhandle error in route ${req.method} ${req.url}`, err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, message, status, process.env.NODE_ENV === 'development' ? err.stack : null);
};

module.exports = errorHandler;
