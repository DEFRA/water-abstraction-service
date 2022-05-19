'use strict'

const service = require('../../lib/services/scheduled-notifications')
const htmlGeneration = require('../../lib/services/pdf-generation/html')

const getRenderNotification = async request => {
  const { notificationId } = request.params
  const notification = await service.getScheduledNotificationById(notificationId)
  return htmlGeneration.createHtmlFromScheduledNotification(notification)
}

exports.getRenderNotification = getRenderNotification
