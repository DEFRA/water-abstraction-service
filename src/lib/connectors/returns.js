const {APIClient} = require('@envage/hapi-pg-rest-api');
const moment = require('moment');

const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

const createClient = path => {
  return new APIClient(rp, {
    endpoint: `${process.env.RETURNS_URI}/${path}`,
    headers: {
      Authorization: process.env.JWT_TOKEN
    }
  });
};

const returnsClient = createClient('returns');

const versionsClient = createClient('versions');

const linesClient = createClient('lines');

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
