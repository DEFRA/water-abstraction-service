const Joi = require('joi');
const { head } = require('lodash');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const apiClientFactory = require('./api-client-factory');
const urlJoin = require('url-join');
const config = require('../../../config');
const factory = require('./service-version-factory');
const helpers = require('@envage/water-abstraction-helpers');
const uuid = require('uuid/v4');

const usersClient = apiClientFactory.create(urlJoin(config.services.idm, 'user'));
const kpiClient = apiClientFactory.create(urlJoin(config.services.idm, 'kpi'));

const validateApplication = application => Joi.assert(
  application,
  Joi.string().required().valid(Object.values(config.idm.application))
);

/**
 * Find all users that have an external_id value in the array of ids
 */
usersClient.getUsersByExternalId = async ids => {
  if (ids.length === 0) {
    return { data: [] };
  }
  return usersClient.findMany({
    external_id: { $in: ids },
    application: config.idm.application.externalUser
  });
};

/**
 * Find a single user that has the given user name
 */
usersClient.getUserByUsername = async (userName, application) => {
  validateApplication(application);

  const { error, data } = await usersClient.findMany({
    user_name: userName,
    application
  });

  throwIfError(error);
  return head(data);
};

/**
 * call IDM to check user credentials and create email change record
 */
const createEmailChangeRecord = (userId, password) => {
  const url = `${config.services.idm}/user/change-email-address/start`;
  return helpers.serviceRequest.post(url, { userId, password });
};

/**
 * call IDM to update record with new email address
 */
const addNewEmailToEmailChangeRecord = (verificationId, newEmail) => {
  const url = `${config.services.idm}/user/change-email-address/create-code`;
  return helpers.serviceRequest.patch(url, { verificationId, newEmail });
};

/**
 * check if record matching userId and securityCode exists
 * @param  {Int} userId
 * @param  {Int} securityCode
 */
const verifySecurityCode = (userId, securityCode) => {
  const url = `${config.services.idm}/user/change-email-address/complete`;
  return helpers.serviceRequest.post(url, { userId, securityCode });
};

/** Creates a new user in the IDM for the given application
 *
 * @param {String} username - The username
 * @param {String} application - The idm application (water_vml|water_admin)
 * @param {String} externalId - The CRM entity id
 * @returns {Promise} A promise that will resolve with the newly created user
 */
usersClient.createUser = async (username, application, externalId) => {
  validateApplication(application);

  const userData = {
    user_name: username,
    password: uuid(),
    reset_guid: uuid(),
    reset_required: 1,
    application,
    external_id: externalId,
    bad_logins: 0,
    reset_guid_date_created: new Date()
  };

  const { data: user, error } = await usersClient.create(userData);
  throwIfError(error);
  return user;
};

exports.usersClient = usersClient;
exports.getServiceVersion = factory.create(config.services.crm);
exports.kpiClient = kpiClient;
exports.createEmailChangeRecord = createEmailChangeRecord;
exports.addNewEmailToEmailChangeRecord = addNewEmailToEmailChangeRecord;
exports.verifySecurityCode = verifySecurityCode;
