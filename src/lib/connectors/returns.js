const apiClientFactory = require('./api-client-factory');
const moment = require('moment');
const { last } = require('lodash');
const helpers = require('@envage/water-abstraction-helpers');

const returnsClient = apiClientFactory.create(`${process.env.RETURNS_URI}/returns`);

const versionsClient = apiClientFactory.create(`${process.env.RETURNS_URI}/versions`);

const linesClient = apiClientFactory.create(`${process.env.RETURNS_URI}/lines`);

/**
 * Gets an array of returns in the return service matching the
 * uploaded returns that are not void and are current.
 * @param  {Array} returnIds - an array of return IDs to find
 * @return {Array} active returns found in returns service
 */
const getActiveReturns = (returnIds) => {
  const filter = {
    return_id: {
      $in: returnIds
    },
    status: {
      $ne: 'void'
    },
    end_date: {
      $gte: '2018-10-31',
      $lte: moment().format('YYYY-MM-DD')
    },
    'metadata->>isCurrent': 'true'
  };

  const columns = ['return_id', 'status', 'due_date'];

  return returnsClient.findAll(filter, null, columns);
};

/**
 * Gets due returns in the current cycle that relate to the current version
 * of a licence.
 * @param  {Array} excludeLicences - if passed in, these licences will be excluded
 * @param  {String} [refDate]      - optional ref date, used for testing
 * @return {Promise<Array>}        - all returns matching criteria
 */
const getCurrentDueReturns = (excludeLicences, refDate) => {
  const cycles = helpers.returns.date.createReturnCycles(undefined, refDate);
  const { endDate } = last(cycles);

  const filter = {
    end_date: endDate,
    status: 'due',
    regime: 'water',
    licence_type: 'abstraction',
    'metadata->>isCurrent': 'true'
  };

  if (excludeLicences.length) {
    filter.licence_ref = {
      $nin: excludeLicences
    };
  }

  return returnsClient.findAll(filter, null);
};

exports.returns = returnsClient;
exports.versions = versionsClient;
exports.lines = linesClient;
exports.getActiveReturns = getActiveReturns;
exports.getCurrentDueReturns = getCurrentDueReturns;
