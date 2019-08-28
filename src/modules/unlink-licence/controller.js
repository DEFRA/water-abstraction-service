const idmConnector = require('../../lib/connectors/idm');
const crmDocumentsConnector = require('../../lib/connectors/crm/documents');
const event = require('../../lib/event');
const Boom = require('@hapi/boom');
const { logger } = require('../../logger');

const userCanUnlinkLicences = user => user.roles.includes('unlink_licences');

/**
* Get Calling User data and check that they have the appropriate permissions
* @param  {Integer} callingUserId User Id of internal user making request
* @return {Object}                User data
*/
const getCallingUser = async callingUserId => {
  const user = await idmConnector.usersClient.findOneById(callingUserId);

  if (!userCanUnlinkLicences(user)) {
    throw Boom.forbidden('Calling user not authorised to unlink licence');
  }

  return user;
};

const createUnlinkLicenceEvent = (callingUser, document) => {
  const auditEvent = event.create({
    type: 'unlink-licence',
    issuer: callingUser.user_name,
    metadata: {
      documentId: document.document_id
    }
  });
  return event.save(auditEvent);
};

/**
 * Unlinks licence from User
 * @param  {Object} request - HAPI request
 * @param  {Object} h       - HAPI reply interface
 * @return {Promise}         [description]
 */
const patchUnlinkLicence = async (request, h) => {
  const { callingUserId } = request.payload;
  const { documentId } = request.params;

  try {
    const callingUser = await getCallingUser(callingUserId);
    const document = await crmDocumentsConnector.unlinkLicence(documentId);
    await createUnlinkLicenceEvent(callingUser, document);

    // respond with unlinked licence
    return document;
  } catch (err) {
    logger.error('Failed to unlink licence', err, {
      callingUserId, documentId });
    if (err.isBoom) {
      return err;
    }
    throw err;
  }
};

exports.patchUnlinkLicence = patchUnlinkLicence;
exports.getCallingUser = getCallingUser;
exports.createUnlinkLicenceEvent = createUnlinkLicenceEvent;
