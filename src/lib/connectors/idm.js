const { head } = require('lodash');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const apiClientFactory = require('./api-client-factory');

const usersClient = apiClientFactory.create(`${process.env.IDM_URI}/user`);

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
  const { error, data } = await usersClient.findMany({ user_name: userName });
  throwIfError(error);
  return head(data);
};

exports.usersClient = usersClient;
