const { APIClient } = require('@envage/hapi-pg-rest-api');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

/**
 * Get user by numeric ID/email address
 * @param {String|Number} numeric ID or string email address
 * @return {Promise} resolves with user if found
 */
function getUsers () {
  return rp({
    uri: process.env.IDM_URI + '/user/',
    method: 'GET',
    json: true,
    headers: {
      Authorization: process.env.JWT_TOKEN
    }
  });
}

const users = new APIClient(rp, {
  endpoint: process.env.IDM_URI + '/user',
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

module.exports = {
  getUsers: getUsers,
  users
};
