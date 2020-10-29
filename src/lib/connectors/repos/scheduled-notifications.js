'use strict';

const helpers = require('./lib/helpers');
const ScheduledNotification = require('../bookshelf/ScheduledNotification');

/**
 * Gets a scheduled notification by id
 */
const findOne = id => helpers.findOne(ScheduledNotification, 'id', id);

const create = data => helpers.create(ScheduledNotification, data);

const update = (id, changes) => helpers.update(ScheduledNotification, 'id', id, changes);

exports.create = create;
exports.findOne = findOne;
exports.update = update;
