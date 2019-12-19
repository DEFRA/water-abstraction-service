const regionsConnector = require('../../lib/connectors/regions');
const camelCaseKeys = require('../../lib/camel-case-keys');

/**
 * Gets the regions from the database and transforms all keys to camel case
 * for easier consumption upstream
 */
const getRegions = async () => {
  const { rows: regions } = await regionsConnector.getRegions();
  return {
    data: camelCaseKeys(regions)
  };
};

exports.getRegions = getRegions;
