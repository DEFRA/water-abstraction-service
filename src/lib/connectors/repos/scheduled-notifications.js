'use strict';

const helpers = require('./lib/helpers');
const raw = require('./lib/raw');
const ScheduledNotification = require('../bookshelf/ScheduledNotification');
const envelope = require('./lib/envelope');

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

/**
 * Finds scheduled notifications by licence number
 * Checks if messages are delivered/received in Notify
 *
 * @param {String} licenceNumber
 * @param {Number} page
 * @param {Number} perPage
 * @returns
 */
const findByLicenceNumber = async (licenceNumber, page, perPage) => {
  const collection = await ScheduledNotification
    .forge()
    .where('licences', '@>', `"${licenceNumber}"`)
    .where('notify_status', 'in', ['delivered', 'received'])
    .where('status', 'sent')
    .where('event_id', 'is not', null)
    .orderBy('send_after', 'desc')
    .fetchPage({
      page: 1,
      pageSize: perPage,
      withRelated: [
        'event'
      ]
    });
  return envelope.paginatedEnvelope(collection);
};

const getScheduledNotificationCategories = () =>
  raw.multiRow('SELECT * FROM water.scheduled_notification_categories where is_enabled is true');

exports.create = create;
exports.findOne = findOne;
exports.findOneByNotifyId = findOneByNotifyId;
exports.update = update;
exports.findByEventId = findByEventId;
exports.findByLicenceNumber = findByLicenceNumber;
exports.getScheduledNotificationCategories = getScheduledNotificationCategories;
