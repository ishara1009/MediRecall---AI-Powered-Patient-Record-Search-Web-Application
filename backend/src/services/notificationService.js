const Notification = require('../models/Notification');
const emailService = require('./emailService');
const User = require('../models/User');
const createNotification = async ({ recipient, type, title, message, resourceKind, resourceId, emailTemplate }) => {
  const notification = await Notification.create({ recipient, type, title, message, relatedResource: { kind: resourceKind, id: resourceId } });
  if (emailTemplate) {
    const user = await User.findById(recipient).select('email').lean();
    if (user?.email) emailService.send({ to: user.email, template: emailTemplate, data: { title, message, resourceId } }).catch(() => {});
  }
  return notification;
};
module.exports = { createNotification };
