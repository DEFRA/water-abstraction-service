'use strict';

const Boom = require('@hapi/boom');
const controller = require('../../../lib/controller');
const licencesService = require('../../../lib/services/licences');
const documentsService = require('../../../lib/services/documents-service');
const crmDocumentsConnector = require('../../../lib/connectors/crm/documents');
const scheduledNotificationsService = require('../../../lib/services/scheduled-notifications');
const mapErrorResponse = require('../../../lib/map-error-response');

const getLicence = async request =>
  controller.getEntity(request.params.licenceId, licencesService.getLicenceById);

const getLicenceVersions = async request =>
  licencesService.getLicenceVersions(request.params.licenceId);

const getLicenceAccountsByRefAndDate = async request =>
  licencesService.getLicenceAccountsByRefAndDate(request.query.documentRef, request.query.date);

/**
 * Gets the CRM v1 document associated with the specified licence
 */
const getLicenceDocument = async request => {
  const { licenceId } = request.params;
  const { includeExpired } = request.query;
  const licence = await licencesService.getLicenceById(licenceId);
  if (!licence) {
    return Boom.notFound(`Licence ${licenceId} not found`);
  }
  const [doc] = await crmDocumentsConnector.getDocumentsByLicenceNumbers([licence.licenceNumber], includeExpired);

  return doc || Boom.notFound(`Document not found for licence ${licenceId}`);
};

const getValidLicenceDocumentByDate = async request => {
  const { licenceId, date } = request.params;
  const licence = await licencesService.getLicenceById(licenceId);
  if (!licence) {
    return Boom.notFound(`Licence ${licenceId} not found`);
  }
  return documentsService.getValidDocumentOnDate(licence.licenceNumber, date);
};

/**
 * Gets returns for the requested licence ID.
 * Currently this gets all returns, but it is expected that this could be
 * extended to get external user returns between a certain date range based
 * on the current user
 */
const getLicenceReturns = async request => {
  const { licenceId } = request.params;
  const { page, perPage } = request.query;
  const result = await licencesService.getLicenceReturns(licenceId, page, perPage);
  if (!result) {
    return Boom.notFound(`Returns for ${licenceId} not found`);
  }
  return result;
};

const getLicenceNotifications = async request => {
  const { licenceId } = request.params;
  try {
    return await scheduledNotificationsService.getScheduledNotificationsByLicenceId(licenceId);
  } catch (err) {
    return mapErrorResponse(err);
  }
};

exports.getLicence = getLicence;
exports.getLicenceVersions = getLicenceVersions;
exports.getLicenceAccountsByRefAndDate = getLicenceAccountsByRefAndDate;
exports.getLicenceDocument = getLicenceDocument;
exports.getValidLicenceDocumentByDate = getValidLicenceDocumentByDate;
exports.getLicenceReturns = getLicenceReturns;
exports.getLicenceNotifications = getLicenceNotifications;
