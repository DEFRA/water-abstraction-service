'use strict';

const { get } = require('lodash');
const repo = require('../connectors/repos/scheduled-notifications');
const mapper = require('../mappers/scheduled-notification');
const service = require('./service');
const { MESSAGE_STATUSES } = require('../models/scheduled-notification');

const getScheduledNotificationById = id =>
  service.findOne(id, repo.findOne, mapper);

const createScheduledNotification = async scheduledNotification => {
  const dbRow = mapper.modelToDb(scheduledNotification);
  const saved = await repo.create(dbRow);
  return mapper.dbToModel(saved);
};

/**
 * Updates message with notify response and marks message as sent
 * @param  {String}  messageId - the message GUID
 * @param  {Object} notifyResponse - response from Notify REST API
 * @return {Promise} resolves when scheduled notification record updated
 */
const updateScheduledNotificationWithNotifyResponse = (messageId, notifyResponse) => {
  const notifyId = get(notifyResponse, 'body.id', null);
  const plainText = get(notifyResponse, 'body.content.body', '');
  const changes = {
    status: MESSAGE_STATUSES.sent,
    notify_id: notifyId,
    plaintext: plainText
  };
  return repo.update(messageId, changes);
};

const updateScheduledNotificationWithNotifyCallback = (messageId, status) => repo.update(messageId, { notifyStatus: status });

exports.createScheduledNotification = createScheduledNotification;
exports.getScheduledNotificationById = getScheduledNotificationById;
exports.updateScheduledNotificationWithNotifyResponse = updateScheduledNotificationWithNotifyResponse;
exports.updateScheduledNotificationWithNotifyCallback = updateScheduledNotificationWithNotifyCallback;
