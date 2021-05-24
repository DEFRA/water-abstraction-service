const idmConnector = require('../../lib/connectors/idm');
const Boom = require('@hapi/boom');
const { get, partial } = require('lodash');
const crmEntitiesConnector = require('../../lib/connectors/crm/entities');
const crmDocumentsConnector = require('../../lib/connectors/crm/documents');
const idmUserRolesConnector = require('../../lib/connectors/idm/user-roles');
const config = require('../../../config');
const emailNotifications = require('../../lib/notifications/emails');
const event = require('../../lib/event');
const { getRolesForPermissionKey } = require('../../lib/roles');
const { logger } = require('../../logger');
const licencesService = require('../../lib/services/licences');

const getCallingUser = async callingUserId => {
  const user = await idmConnector.usersClient.findOneById(callingUserId);

  if (!user) {
    throw Boom.notFound(`Calling user ${callingUserId} not found`);
  }

  if (!userCanManageAccounts(user)) {
    throw Boom.forbidden('Calling user not authorised to manage accounts');
  }

  return user;
};

const mapUserStatus = user => {
  return {
    isLocked: parseInt(user.reset_required) === 1,
    isInternal: isInternalUser(user),
    isDisabled: !user.enabled,
    dateDisabled: user.enabled ? null : user.date_updated,
    lastLogin: user.last_login,
    userName: user.user_name
  };
};

const getCompanyLicences = (company, documentHeaders, licencesMap) => {
  const companyEntityId = company.entityId;
  return documentHeaders
    .filter(doc => doc.company_entity_id === companyEntityId)
    .map(doc => ({
      documentId: doc.document_id,
      licenceRef: doc.system_external_id,
      licenceHolder: get(doc, 'metadata.contacts[0].name', ''),
      licence: licencesMap.get(doc.system_external_id)
    }));
};

const getCompanyOutstandingVerifications = (company, verifications) => {
  const companyEntityId = company.entityId;
  return verifications
    .filter(v => v.companyEntityId === companyEntityId)
    .map(v => ({
      code: v.code,
      dateCreated: v.dateCreated,
      licences: v.documents
    }));
};

const mapCompanies = (companies, verifications, documentHeaders, licencesMap) => {
  return companies.map(company => {
    return {
      name: company.name,
      entityId: company.entityId,
      userRoles: company.userRoles,
      outstandingVerifications: getCompanyOutstandingVerifications(company, verifications),
      registeredLicences: getCompanyLicences(company, documentHeaders, licencesMap)
    };
  });
};

const isInternalUser = user => user.application === config.idm.application.internalUser;

/**
 * Gets a map of Licence service models given an array
 * of CRM v1 documents
 *
 * @param {Array} documents
 * @return {Promise<Map>}
 */
const getLicencesMap = async documents => {
  const licenceNumbers = documents.map(doc => doc.system_external_id);
  const licences = await licencesService.getLicencesByLicenceRefs(licenceNumbers);
  return licences.reduce((map, licence) =>
    map.set(licence.licenceNumber, licence)
  , new Map());
};

const getUserCompanyStatus = async user => {
  const entityId = user.external_id;

  if (isInternalUser(user) || !entityId) {
    return Promise.resolve([[], [], []]);
  }

  await crmEntitiesConnector.getEntityCompanies(entityId);

  const documents = await crmDocumentsConnector.findAll({ entity_id: entityId });

  const licencesMap = await getLicencesMap(documents);

  return Promise.all([
    crmEntitiesConnector.getEntityCompanies(entityId),
    crmEntitiesConnector.getEntityVerifications(entityId),
    documents,
    licencesMap
  ]);
};

const userCanManageAccounts = user => user.roles.includes('manage_accounts');

const getExistingUserByEmail = email => idmConnector.usersClient.getUserByUsername(
  email,
  config.idm.application.internalUser
);

const isDisabledUser = user => user && (user.enabled === false);

const createInternalUserEvent = (type, callingUser, newUser) => {
  const auditEvent = event.create({
    type,
    subtype: 'internal',
    issuer: callingUser.user_name,
    metadata: {
      user: newUser.user_name,
      userId: newUser.user_id
    }
  });
  return event.save(auditEvent);
};

const createNewUserEvent = partial(createInternalUserEvent, 'new-user');
const deleteUserEvent = partial(createInternalUserEvent, 'delete-user');
const updateUserRolesEvent = partial(createInternalUserEvent, 'update-user-roles');

const createIdmUser = (email, crmEntityId) => {
  return idmConnector.usersClient.createUser(
    email,
    config.idm.application.internalUser,
    crmEntityId
  );
};

/**
 * Replaces any roles/groups that a user may have with a resolved set based
 * on the permissionsKey
 *
 * @param {Number} userId The users's id
 * @param {String} permissionsKey A value that can be mapped to arrays of roles and groups
 */
const setIdmUserRoles = async (userId, permissionsKey) => {
  const { roles, groups } = getRolesForPermissionKey(permissionsKey);
  const { data: userWithRoles } = await idmUserRolesConnector
    .setInternalUserRoles(userId, roles, groups);

  return userWithRoles;
};

/**
 * Either creates a user, or if a disabled user account is present,
 * re-enables it.
 * If an enabled user account is found, a conflict error is thrown
 * @param  {String} emailAddress - the email address for the new user
 * @param {Object} callingUser - the IDM user object for the calling user
 * @return {Promise<Object>} resolves with the IDM user account record
 */
const createOrEnableUser = async (emailAddress, callingUser) => {
  // Find existing user
  const existingUser = await getExistingUserByEmail(emailAddress);

  if (!existingUser) {
    const { user_name: callingUserEmail } = callingUser;

    // create the crm entity
    const crmEntity = await crmEntitiesConnector
      .getOrCreateInternalUserEntity(emailAddress, callingUserEmail);

    // create the idm user
    const newUser = await createIdmUser(emailAddress, crmEntity.entity_id);

    // send an email to the new user
    const changePasswordUrl = `${config.frontEnds.internal.baseUrl}/reset_password_change_password?resetGuid=${newUser.reset_guid}`;
    await emailNotifications.sendNewInternalUserMessage(emailAddress, changePasswordUrl);

    return newUser;
  }

  if (isDisabledUser(existingUser)) {
    return idmConnector.usersClient.enableUser(existingUser.user_id,
      config.idm.application.internalUser);
  }

  throw Boom.conflict(`An enabled user ${emailAddress} already exists`);
};

const errorHandler = (err, message, params = {}) => {
  logger.error(message, err, params);
  if (err.isBoom) {
    return err;
  }
  throw err;
};

const getStatus = async (request, h) => {
  const userResponse = await idmConnector.usersClient.findOne(request.params.id);

  if (get(userResponse, 'error.name') === 'NotFoundError') {
    return Boom.notFound('User not found');
  }

  const results = await getUserCompanyStatus(userResponse.data);

  const [companies, verifications, documentHeaders = [], licencesMap] = results;

  return {
    data: {
      user: mapUserStatus(userResponse.data),
      companies: mapCompanies(
        get(companies, 'data.companies', []),
        get(verifications, 'data', []),
        documentHeaders,
        licencesMap
      )
    },
    error: null
  };
};

const postUserInternal = async (request, h) => {
  const { callingUserId, newUserEmail, permissionsKey } = request.payload;

  try {
    // Get calling user
    const callingUser = await getCallingUser(callingUserId);

    // Create or re-enable the user
    const newUser = await createOrEnableUser(newUserEmail, callingUser);

    // set the users roles/groups
    const userWithRoles = await setIdmUserRoles(newUser.user_id, permissionsKey);

    // write a message to the event log
    await createNewUserEvent(callingUser, newUser);

    // respond with the user object as part of the response
    return h.response(userWithRoles).code(201);
  } catch (err) {
    return errorHandler(err, 'Failed to create new internal user', {
      callingUserId, newUserEmail, permissionsKey
    });
  }
};

/**
 * Updates a user's roles/groups
 * @param {Number} request.params.userId - IDM user ID of user being patched
 * @param {Number} request.payload.callingUserId - IDM user ID user making change
 * @param {String} request.payload.permissionsKey - maps to roles/groups
 */
const patchUserInternal = async (request, h) => {
  const { userId } = request.params;
  const { callingUserId, permissionsKey } = request.payload;

  try {
    const callingUser = await getCallingUser(callingUserId);

    const user = await idmConnector.usersClient.findOneById(userId);
    if (!user) throw Boom.notFound(`User ${userId} not found`);

    // set the users roles/groups
    const userWithNewRoles = await setIdmUserRoles(userId, permissionsKey);

    // write a message to the event log
    await updateUserRolesEvent(callingUser, user);

    // respond with the user object as part of the response
    return userWithNewRoles;
  } catch (err) {
    return errorHandler(err, 'Failed to update internal user permissions', {
      callingUserId, userId, permissionsKey
    });
  }
};

/**
 * Soft-deletes an internal user by setting their IDM enabled flag to false.
 * Also logs an event for audit purposes
 * @param  {Number}  request.params.id - IDM user ID
 * @param  {Number}  request.payload.callingUserId - the user performing the deletion
 */
const deleteUserInternal = async (request, h) => {
  const { userId } = request.params;
  const { callingUserId } = request.payload;

  try {
    const callingUser = await getCallingUser(callingUserId);

    // Disable the user
    const user = await idmConnector.usersClient.disableUser(userId,
      config.idm.application.internalUser);

    if (!user) {
      throw Boom.notFound(`User ${userId} could not be found`);
    }

    await deleteUserEvent(callingUser, user);

    // Respond with the disabled user
    return user;
  } catch (err) {
    return errorHandler(err, 'Failed to delete internal user', {
      callingUserId, userId
    });
  }
};

exports.getStatus = getStatus;
exports.postUserInternal = postUserInternal;
exports.patchUserInternal = patchUserInternal;
exports.deleteUserInternal = deleteUserInternal;
