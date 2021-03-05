'use strict';

const { isNull } = require('lodash');
const Event = require('./event');

const validators = require('./validators');

class NotificationEvent extends Event {
  /**
   * Sets number of recipients
   * @param {Number} recipientCount
   */
  set recipientCount (recipientCount) {
    validators.assertNullablePositiveOrZeroInteger(recipientCount);
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
}

module.exports = NotificationEvent;
