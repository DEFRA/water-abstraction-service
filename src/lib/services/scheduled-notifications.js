'use strict';

const repo = require('../connectors/repos/scheduled-notifications');
const mapper = require('../mappers/scheduled-notification');
const service = require('./service');

const getScheduledNotificationById = id =>
  service.findOne(id, repo.findOne, mapper);

exports.getScheduledNotificationById = getScheduledNotificationById;
