'use strict';

const Boom = require('@hapi/boom');
const controller = require('../../../lib/controller');
const licencesService = require('../../../lib/services/licences');
const crmDocumentsConnector = require('../../../lib/connectors/crm/documents');

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
  const licence = await licencesService.getLicenceById(licenceId);
  if (!licence) {
    return Boom.notFound(`Licence ${licenceId} not found`);
  }
  const [doc] = await crmDocumentsConnector.getDocumentsByLicenceNumbers([licence.licenceNumber]);

  return doc || Boom.notFound(`Document not found for licence ${licenceId}`);
};

exports.getLicence = getLicence;
exports.getLicenceVersions = getLicenceVersions;
exports.getLicenceAccountsByRefAndDate = getLicenceAccountsByRefAndDate;
exports.getLicenceDocument = getLicenceDocument;
