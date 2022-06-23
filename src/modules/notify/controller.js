const Boom = require('@hapi/boom')
const scheduledNotificationsService = require('../../lib/services/scheduled-notifications')
const { logger } = require('../../logger')
const { enqueue } = require('./index.js')
const notifyService = require('../../lib/notify')
/**
 * Gets the notify template ID for a notify message ref,
 * and sends it using the notify API
 *
 *  Sample CURL
 *  curl -X POST '../notify/password_reset_email' -d '{"recipient":"email@email.com","personalisation":{"firstname":"name","reset_url":"url"}}'
 *
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} [request.query] - GET query params
 * @param {String} [request.query.recipient] - recipient of the notify message
 * @param {String} [request.query.message_ref] - the internal ref of the message to be sent
 * @param {String} [request.payload.personalisation] - the personalisation packet
 * @param {Object} reply - the HAPI HTTP response
 */
async function send (request, reply) {
  const { message_ref: messageRef } = request.params
  const { id, recipient, personalisation } = request.payload

  const config = {
    id,
    messageRef,
    recipient,
    personalisation
  }

  try {
    await enqueue(request.queueManager, config)
    return config
  } catch (err) {
    if (err.isBoom && (err.output.statusCode !== 500)) {
      throw Boom.badRequest(err.message)
    }
    if (err.name === 'TemplateNotFoundError') {
      throw Boom.boomify(err, { statusCode: 400 })
    }
    if (err.name === 'StatusCodeError') {
      throw Boom.boomify(err, { statusCode: err.statusCode })
    }
    throw err
  }
}

const callback = async (request, h) => {
  const { status, id } = request.payload

  const notification = await scheduledNotificationsService.getScheduledNotificationByNotifyId(id)

  if (notification === null) {
    logger.error(`Notify callback: Failed to set status (${status}) on a notification (NOTIFY ID ${id}) as the notification could not be found.`)
    return Boom.notFound('Notification not found')
  } else {
    await scheduledNotificationsService.updateScheduledNotificationWithNotifyCallback(notification.id, status)
    logger.info(`Notify callback: Successfully set status (${status}) on notification (NOTIFY ID ${id})`)

    return h.response(null).code(204)
  }
}

/**
 * A very basic proxy service to send notify emails via the water service
 */
const notifyEmailProxy = async request => {
  const { templateId, recipient, personalisation } = request.payload
  return notifyService.sendEmail(templateId, recipient, personalisation)
}

exports.send = send
exports.callback = callback
exports.notifyEmailProxy = notifyEmailProxy
