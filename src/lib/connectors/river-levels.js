const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

/**
 * Get data on a particular gauging station
 * @param {String} id - gauging station ID
 * @return {Promise} - resolves with real-time data
 */
function getStation (id) {
  const uri = `https://environment.data.gov.uk/flood-monitoring/id/stations/${id}.json`;

  return rp({
    uri,
    method: 'GET',
    json: true
  });
}

module.exports = {
  getStation
};
