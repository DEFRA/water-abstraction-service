'use strict';

const helpers = require('./lib/helpers');
const ScheduledNotification = require('../bookshelf/ScheduledNotification');

/**
 * Gets a scheduled notification by id
 */
const findOne = id => helpers.findOne(ScheduledNotification, 'id', id);

exports.findOne = findOne;
