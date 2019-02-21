const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

const { APIClient } = require('@envage/hapi-pg-rest-api');

const usersClient = new APIClient(rp, {
  endpoint: process.env.IDM_URI + '/user',
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

/**
 * Find all users that have an external_id value in the array of ids
 */
usersClient.getUsersByExternalId = async ids => {
  return usersClient.findMany({
    external_id: { $in: ids }
  });
};

/**
 * Find a single user that has the given user name
 */
usersClient.getUserByUserName = async userName => {
  return usersClient.findMany({
    user_name: userName
  });
};

module.exports = {
  usersClient
};
