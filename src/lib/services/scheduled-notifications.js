'use strict';

const repo = require('../connectors/repos/scheduled-notifications');
const mapper = require('../mappers/scheduled-notification');
const service = require('./service');

const getScheduledNotificationById = id =>
  service.findOne(id, repo.findOne, mapper);

const createScheduledNotification = async scheduledNotification => {
  const dbRow = mapper.modelToDb(scheduledNotification);
  const saved = await repo.create(dbRow);
  return mapper.dbToModel(saved);
};

exports.createScheduledNotification = createScheduledNotification;
exports.getScheduledNotificationById = getScheduledNotificationById;
