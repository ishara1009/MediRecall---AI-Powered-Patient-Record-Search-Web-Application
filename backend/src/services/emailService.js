const logger = require('../utils/logger');

class EmailService {
  async send({ to, template, data }) {
    if (!process.env.EMAIL_PROVIDER) {
      logger.info(`Email provider not configured; skipped ${template} email to ${to}.`);
      return { delivered: false, reason: 'provider_not_configured' };
    }
    // Provider adapters (SMTP, SendGrid, SES, etc.) should be implemented here.
    // Credentials remain server-side in environment variables.
    logger.info(`Email adapter ${process.env.EMAIL_PROVIDER} requested template ${template}.`);
    return { delivered: false, reason: 'adapter_not_implemented', data };
  }
}
module.exports = new EmailService();
