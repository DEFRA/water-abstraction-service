'use strict';

const { isNull } = require('lodash');
const Event = require('./event');
const ScheduledNotification = require('./scheduled-notification');

const validators = require('./validators');

class NotificationEvent extends Event {
  /**
   * Sets number of recipients
   * @param {Number} recipientCount
   */
  set recipientCount (recipientCount) {
    validators.assertPositiveOrZeroInteger(recipientCount);
    this._recipientCount = isNull(recipientCount) ? null : parseInt(recipientCount);
  }

  get recipientCount () {
    return this._recipientCount;
  }

  /**
   * Sets number of errors
   * @param {Number} errorCount
   */
  set errorCount (errorCount) {
    validators.assertNullablePositiveOrZeroInteger(errorCount);
    this._errorCount = isNull(errorCount) ? null : parseInt(errorCount);
  }

  get errorCount () {
    return this._errorCount;
  }

  /**
   * Scheuled notifications
   * @return {Array<ScheduledNotification>}
   */
  get scheduledNotifications () {
    return this._scheduledNotifications;
  }

  set scheduledNotifications (scheduledNotifications) {
    validators.assertIsArrayOfType(scheduledNotifications, ScheduledNotification);
    this._scheduledNotifications = scheduledNotifications;
  }
}

module.exports = NotificationEvent;
