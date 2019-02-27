const apiClientFactory = require('./api-client-factory');
const moment = require('moment');

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

  const columns = ['return_id', 'status'];

  return returnsClient.findAll(filter, null, columns);
};

exports.returns = returnsClient;
exports.versions = versionsClient;
exports.lines = linesClient;
exports.getActiveReturns = getActiveReturns;
