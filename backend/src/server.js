require('dotenv').config();
const app = require('./app');
const db = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Always start the HTTP server — DB connection is attempted in parallel
app.listen(PORT, () => {
  logger.info(`MediRecall backend listening on port ${PORT}`);
});

// Connect to MongoDB — failures are logged but do NOT kill the process
db.connect()
  .then(() => {
    logger.info('MongoDB connected successfully');
  })
  .catch((err) => {
    logger.error(`MongoDB connection failed: ${err.message}`);
    logger.warn('Server running in DEGRADED mode — database is unavailable');
  });
