const moment = require('moment');
const { last } = require('lodash');
const helpers = require('@envage/water-abstraction-helpers');

const eventHelpers = require('../../../lib/event-helpers');
const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Creates and persists a notification event, decorated with info
 * about the return cycle targeted for this notification
 * @param  {String}  issuer - email address of user sending message
 * @param {Object} config   - message config
 * @param  {Object}  options   - message data - placed in event metadata
 * @return {Promise}          resolves with event data
 */
const createEvent = async (...args) => {
  const evt = eventHelpers.createEvent(...args);

  // The reference date is today + 14 days.  This allows returns notifications
  // to be sent for the following return cycle up to 14 days before the cycle ends
  const refDate = moment().add(14, 'day');

  // Create return cycles
  const cycles = helpers.returns.date.createReturnCycles(undefined, refDate);
  const { startDate, endDate, isSummer } = last(cycles);
  const dueDate = moment(endDate).add(28, 'day').format(DATE_FORMAT);

  // Decorate event with return cycle info
  evt.metadata.returnCycle = {
    startDate,
    endDate,
    isSummer,
    dueDate
  };

  return evt;
};

exports.createEvent = createEvent;
