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
const getCurrentDueReturns = async (excludeLicences, refDate) => {
  const cycles = helpers.returns.date.createReturnCycles(undefined, refDate);
  const { endDate } = last(cycles);

  const filter = {
    end_date: endDate,
    status: 'due',
    regime: 'water',
    licence_type: 'abstraction',
    'metadata->>isCurrent': 'true'
  };

  const results = await returnsClient.findAll(filter);

  return results.filter(ret => !excludeLicences.includes(ret.licence_ref));
};

/**
 * Makes a POST request to the returns service that causes any
 * returns not in the list of validReturnIds for the given
 * licence number to be marked as void.
 *
 * @param {String} licenceNumber The licence number
 * @param {Array} validReturnIds An array of return ids that are valid and
 * therefore will not be made void
 */
const voidReturns = (licenceNumber, validReturnIds = []) => {
  if (!validReturnIds.length) {
    return Promise.resolve();
  }

  const url = `${process.env.RETURNS_URI}/void-returns`;
  const body = {
    regime: 'water',
    licenceType: 'abstraction',
    licenceNumber,
    validReturnIds
  };

  return helpers.serviceRequest.patch(url, { body });
};

exports.returns = returnsClient;
exports.versions = versionsClient;
exports.lines = linesClient;
exports.getActiveReturns = getActiveReturns;
exports.getCurrentDueReturns = getCurrentDueReturns;
exports.voidReturns = voidReturns;
