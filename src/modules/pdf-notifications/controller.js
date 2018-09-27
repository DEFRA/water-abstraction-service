const Boom = require('boom');
const scheduledNotification = require('../../controllers/notifications').repository;
const { getViewPath } = require('./helpers');

/**
 * Renders a notification message based on a scheduled_notification ID
 * this will be rendered in HTML to be converted later to PDF
 * @param {String} request.params.notificationId - GUID
 */
const getRenderNotification = async (request, h) => {
  const { notificationId: id } = request.params;
  const { rows: [ notification ], error } = await scheduledNotification.find({id});

  if (error) {
    throw Boom.badImplementation(error);
  }
  if (!notification) {
    throw Boom.notFound(`Notification ${id} not found`);
  }

  return h.view(getViewPath(notification.message_ref), { notification });
};

module.exports = {
  getRenderNotification
};
