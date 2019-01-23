const { get } = require('lodash');

/**
 * Checks whether the supplied station is active
 * Not all stations have this property, so if the property is absent we should
 * return true
 * @param  {Object} data - data from https://environment.data.gov.uk/flood-monitoring/doc/reference
 * @return {Boolean}       whether station is active
 */
const stationIsActive = (data) => {
  const status = get(data, 'items.status');
  if (status) {
    return /^https?:\/\/environment.data.gov.uk\/flood-monitoring\/def\/core\/statusActive$/.test(status);
  }
  return true;
};

module.exports = {
  stationIsActive
};
