const QRCode = require('qrcode-svg');
const scheduledNotification = require('../../controllers/notifications').repository;
const { findOne } = require('../../lib/repository-helpers');
const nunjucks = require('nunjucks');
const { testMode } = require('../../../config');

const viewHelpers = require('./view-helpers');
const logger = require('../../lib/logger');

const env = nunjucks.configure('./src/views/pdf-notifications/', {
  noCache: testMode
});

/**
 * Create render function that renders using Nunjucks environment
 * @param {String} view - the view/template name
 * @param {Object} data - data to send to view
 * @return {Promise} resolves with rendered template, or rejects with error
 */
const render = (view, data) => {
  return new Promise((resolve, reject) => {
    env.render(view, data, (err, result) => {
      return err ? reject(err) : resolve(result);
    });
  });
};

env.addFilter('naldRegion', viewHelpers.naldRegion);
env.addFilter('naldArea', viewHelpers.naldArea);
env.addFilter('date', viewHelpers.dateFormat);
env.addGlobal('paginateReturnLines', viewHelpers.paginateReturnLines);
env.addFilter('stringify', viewHelpers.stringify);
env.addGlobal('qrCode', (content, size) => {
  return new QRCode({
    content,
    width: size,
    height: size
  }).svg();
});

/**
 * Gets the relevant view template path given a message ref
 * for PDF messages
 * @param {String} messageRef
 * @return {String} view path
 */
const getViewPath = (messageRef) => {
  const view = messageRef.replace(/^pdf\./i, '');
  return `${view}.html`;
};

/**
 * Renders a notification message based on a scheduled_notification ID
 * this will be rendered in HTML to be converted later to PDF
 * @param {String} request.params.notificationId - GUID
 * @return {Promise} resolves with HTML content
 */
const getRenderNotification = async (notificationId) => {
  const notification = await findOne(scheduledNotification, notificationId);
  const view = getViewPath(notification.message_ref);

  logger.info(JSON.stringify({ notification }, null, 2));
  return render(view, { notification });
};

module.exports = {
  getRenderNotification,
  getViewPath
};
