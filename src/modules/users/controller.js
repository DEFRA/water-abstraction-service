const idmConnector = require('../../lib/connectors/idm');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const Boom = require('@hapi/boom');
const { get } = require('lodash');
const crmEntitiesConnector = require('../../lib/connectors/crm/entities');
const crmDocumentsConnector = require('../../lib/connectors/crm/documents');
const idmUserRolesConnector = require('../../lib/connectors/idm/user-roles');
const config = require('../../../config');
const emailNotifications = require('../../lib/notifications/emails');
const event = require('../../lib/event');
const { getRolesForPermissionKey } = require('../../lib/roles');
const { logger } = require('../../logger');

const mapUserStatus = user => {
  return {
    isLocked: parseInt(user.reset_required) === 1,
    isInternal: !get(user, 'role.scopes', []).includes('external'),
    lastLogin: user.last_login,
    userName: user.user_name
  };
};

const getCompanyLicences = (company, documentHeaders) => {
  const companyEntityId = company.entityId;
  return documentHeaders
    .filter(doc => doc.company_entity_id === companyEntityId)
    .map(doc => ({
      documentId: doc.document_id,
      licenceRef: doc.system_external_id,
      licenceHolder: get(doc, 'metadata.contacts[0].name', '')
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

const mapCompanies = (companies, verifications, documentHeaders) => {
  return companies.map(company => {
    return {
      name: company.name,
      entityId: company.entityId,
      userRoles: company.userRoles,
      outstandingVerifications: getCompanyOutstandingVerifications(company, verifications),
      registeredLicences: getCompanyLicences(company, documentHeaders)
    };
  });
};

const isInternalUser = user => get(user, 'role.scopes', []).includes('internal');

const getUserCompanyStatus = user => {
  const entityId = user.external_id;

  if (isInternalUser(user) || !entityId) {
    return Promise.resolve([[], [], []]);
  }

  return Promise.all([
    crmEntitiesConnector.getEntityCompanies(entityId),
    crmEntitiesConnector.getEntityVerifications(entityId),
    crmDocumentsConnector.findAll({ entity_id: entityId })
  ]);
};

const getStatus = async (request, h) => {
  const userResponse = await idmConnector.usersClient.findOne(request.params.id);

  if (get(userResponse, 'error.name') === 'NotFoundError') {
    return Boom.notFound('User not found');
  }

  return getUserCompanyStatus(userResponse.data).then(results => {
    const [companies, verifications, documentHeaders = []] = results;

    return {
      data: {
        user: mapUserStatus(userResponse.data),
        companies: mapCompanies(
          get(companies, 'data.companies', []),
          get(verifications, 'data', []),
          documentHeaders
        )
      },
      error: null
    };
  });
};

const userCanManageAccounts = user => user.roles.includes('manage_accounts');

const internalUserExists = async email => {
  const existingUser = await idmConnector.usersClient.getUserByUsername(
    email,
    config.idm.application.internalUser
  );

  return !!existingUser;
};

const createNewUserEvent = (callingUser, newUser) => {
  const auditEvent = event.create({
    type: 'new-user',
    subtype: 'internal',
    issuer: callingUser,
    metadata: {
      user: newUser
    }
  });

  return event.save(auditEvent);
};

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

const postUserInternal = async (request, h) => {
  const { callingUserId, newUserEmail, permissionsKey } = request.payload;
  const { data: user, error } = await idmConnector.usersClient.findOne(callingUserId);
  throwIfError(error);

  if (!userCanManageAccounts(user)) {
    return Boom.forbidden('Calling user not authorised to manage accounts');
  }

  // TODO: When user deletion is implemented this should handle the
  // restoration of a previously deleted user
  if (await internalUserExists(newUserEmail)) {
    return Boom.conflict(`User with name ${newUserEmail} already exists`);
  }

  try {
  // create the crm entity
    const crmEntity = await crmEntitiesConnector.getOrCreateInternalUserEntity(newUserEmail, user.user_name);

    // create the idm user
    const newUser = await createIdmUser(newUserEmail, crmEntity.entity_id);

    // set the users roles/groups
    const userWithRoles = await setIdmUserRoles(newUser.user_id, permissionsKey);

    // send an email to the new user
    const changePasswordUrl = `${config.frontEnds.viewMyLicence.baseUrl}/reset_password_change_password?resetGuid=${newUser.reset_guid}`;
    await emailNotifications.sendNewInternalUserMessage(newUserEmail, changePasswordUrl);

    // write a message to the event log
    await createNewUserEvent(user.user_name, newUserEmail);

    // respond with the user object as part of the response
    return h.response(userWithRoles).code(201);
  } catch (err) {
    logger.error('Failed to create new internal user', err, {
      callingUserId, newUserEmail, permissionsKey
    });
    throw err;
  }
};

exports.getStatus = getStatus;
exports.postUserInternal = postUserInternal;
