const regionsConnector = require('../../lib/connectors/regions');
const camelCaseKeys = require('../../lib/camel-case-keys');
const { throwIfError } = require('@envage/hapi-pg-rest-api');

/**
 * Gets the regions from the database and transforms all keys to camel case
 * for easier consumption upstream
 */
const getRegions = async () => {
  const { rows: regions, error } = await regionsConnector.getRegions();
  throwIfError(error);
  return {
    data: camelCaseKeys(regions)
  };
};

exports.getRegions = getRegions;
