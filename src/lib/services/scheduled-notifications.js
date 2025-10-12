'use strict'

const repo = require('../connectors/repos/scheduled-notifications')
const mapper = require('../mappers/scheduled-notification')
const service = require('./service')
const { MESSAGE_STATUSES } = require('../models/scheduled-notification')

const getScheduledNotificationById = id =>
  service.findOne(id, repo.findOne, mapper)

const getScheduledNotificationByNotifyId = notifyId => repo.findOneByNotifyId(notifyId)

const createScheduledNotification = async scheduledNotification => {
  const dbRow = mapper.modelToDb(scheduledNotification)
  const saved = await repo.create(dbRow)
  return mapper.dbToModel(saved)
}

/**
 * Updates message with notify response and marks message as sent
 * @param  {String}  messageId - the message GUID
 * @param  {Object} notifyResponse - response from Notify REST API
 * @return {Promise} resolves when scheduled notification record updated
 */
const updateScheduledNotificationWithNotifyResponse = (messageId, notifyResponse) => {
  const notifyId = notifyResponse.body?.id ?? null
  const plainText = notifyResponse.body?.content?.body ?? null
  const changes = {
    status: MESSAGE_STATUSES.sent,
    notify_id: notifyId,
    plaintext: plainText
  }
  return repo.update(messageId, changes)
}

const updateScheduledNotificationWithNotifyCallback = (messageId, status) => repo.update(messageId, { notifyStatus: status })

/**
 * Get all scheduled notifications by event ID
 * @param {String} eventId
 * @return {Promise<ScheduledNotification>}
 */
const getByEventId = async eventId => {
  const data = await repo.findByEventId(eventId)
  return data.map(mapper.dbToModel)
}

/**
 * Gets the scheduled notifications by licence ID.
 * Note: this currently only returns sent notifications
 *
 * @param {String} licenceId
 * @returns {Promise<Object>}
 */
const getScheduledNotificationsByLicenceNumber = async (licenceNumber, page = 1, perPage = 10) => {
  // Query for notifications
  const { pagination, data } = await repo.findByLicenceNumber(licenceNumber, page, perPage)
  return {
    pagination,
    data: data.map(mapper.dbToModel)
  }
}

const getNotificationCategories = repo.getScheduledNotificationCategories

exports.getScheduledNotificationById = getScheduledNotificationById
exports.getScheduledNotificationByNotifyId = getScheduledNotificationByNotifyId
exports.createScheduledNotification = createScheduledNotification
exports.updateScheduledNotificationWithNotifyResponse = updateScheduledNotificationWithNotifyResponse
exports.updateScheduledNotificationWithNotifyCallback = updateScheduledNotificationWithNotifyCallback
exports.getByEventId = getByEventId
exports.getScheduledNotificationsByLicenceNumber = getScheduledNotificationsByLicenceNumber
exports.getNotificationCategories = getNotificationCategories
