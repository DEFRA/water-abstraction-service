const Boom = require('boom');
const notifyTemplateRepo = require('../../../controllers/notifytemplates').repository;

/**
 * Error class for template not found
 */
class TemplateNotFoundError extends Error {
  constructor (message) {
    super(message);
    this.name = 'TemplateNotFoundError';
  }
}

/**
 * Loads the notify template info from the DB
 * @param {String} messageRef
 * @return {Promise} resolves with object of notify template data
 */
async function findByMessageRef (messageRef) {
  // Load template
  const { error, rows: [notifyTemplate] } = await notifyTemplateRepo.find({ message_ref: messageRef });

  if (error) {
    throw Boom.badImplementation(`Template error ${messageRef}`, error);
  }
  if (!notifyTemplate) {
    throw new TemplateNotFoundError(`Template for message ${messageRef} not found`);
  }

  return notifyTemplate;
}

module.exports = {
  notifyTemplate: notifyTemplateRepo,
  findByMessageRef
};
