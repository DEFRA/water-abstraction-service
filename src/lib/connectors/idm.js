const { head } = require('lodash');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const apiClientFactory = require('./api-client-factory');
const urlJoin = require('url-join');
const config = require('../../../config');
const factory = require('./service-version-factory');
const helpers = require('@envage/water-abstraction-helpers');

const usersClient = apiClientFactory.create(urlJoin(config.services.idm, 'user'));
const kpiClient = apiClientFactory.create(urlJoin(config.services.idm, 'kpi'));

const { idm: { application } } = require('../../../config');

/**
 * Find all users that have an external_id value in the array of ids
 */
usersClient.getUsersByExternalId = async ids => {
  if (ids.length === 0) {
    return { data: [] };
  }
  return usersClient.findMany({
    external_id: { $in: ids },
    application
  });
};

/**
 * Find a single user that has the given user name
 */
usersClient.getUserByUserName = async userName => {
  const { error, data } = await usersClient.findMany({
    user_name: userName,
    application
  });
  throwIfError(error);
  return head(data);
};

usersClient.findOneById = async id => {
  const { error, data } = await usersClient.findOne(id);
  throwIfError(error);
  return data;
};

/**
 * Starts the email change process
 * @param  {Number} userId
 * @param  {String} email  - the new email address
 * @return {Promise}
 */
const startEmailChange = (userId, email) => {
  const url = `${config.services.idm}/user/${userId}/change-email-address`;
  const options = {
    body: {
      email
    }
  };
  return helpers.serviceRequest.post(url, options);
};

/**
 * Completes the email change process with a security code
 * @param  {Number} userId
 * @param  {String} securityCode - 6 digit security code
 * @return {Promise}              [description]
 */
const verifySecurityCode = (userId, securityCode) => {
  const url = `${config.services.idm}/user/${userId}/change-email-address/code`;
  const options = {
    body: {
      securityCode
    }
  };
  return helpers.serviceRequest.post(url, options);
};

/**
 * Check status of email change
 * @param  {Int} userId
 * @param  {Int} securityCode
 */
const getEmailChangeStatus = userId => {
  const url = `${config.services.idm}/user/${userId}/change-email-address`;
  return helpers.serviceRequest.get(url);
};

exports.usersClient = usersClient;
exports.getServiceVersion = factory.create(config.services.crm);
exports.kpiClient = kpiClient;
exports.startEmailChange = startEmailChange;
exports.verifySecurityCode = verifySecurityCode;
exports.getEmailChangeStatus = getEmailChangeStatus;
