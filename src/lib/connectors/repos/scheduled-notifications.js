'use strict';

const helpers = require('./lib/helpers');
const ScheduledNotification = require('../bookshelf/ScheduledNotification');

/**
 * Gets a scheduled notification by id
 */
const findOne = id => helpers.findOne(ScheduledNotification, 'id', id);

const create = data => helpers.create(ScheduledNotification, data);

exports.create = create;
exports.findOne = findOne;
