'use strict';

const helpers = require('./lib/helpers');
const ScheduledNotification = require('../bookshelf/ScheduledNotification');

/**
 * Gets a scheduled notification by id
 */
const findOne = id => helpers.findOne(ScheduledNotification, 'id', id);

const findOneByNotifyId = async notifyId => {
  const model = await ScheduledNotification
    .forge()
    .where({ notify_id: notifyId })
    .fetch({
      require: false
    });

  return model ? model.toJSON() : null;
};

const create = data => helpers.create(ScheduledNotification, data);

const update = (id, changes) => helpers.update(ScheduledNotification, 'id', id, changes);

const findByEventId = eventId =>
  helpers.findMany(ScheduledNotification, { event_id: eventId });

exports.create = create;
exports.findOne = findOne;
exports.findOneByNotifyId = findOneByNotifyId;
exports.update = update;
exports.findByEventId = findByEventId;
