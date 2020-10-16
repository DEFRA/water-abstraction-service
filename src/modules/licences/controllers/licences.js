'use strict';

const Boom = require('@hapi/boom');
const controller = require('../../../lib/controller');
const licencesService = require('../../../lib/services/licences');
const documentsService = require('../../../lib/services/documents-service');
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

const getValidLicenceDocumentByDate = async request => {
  const { licenceId, date } = request.params;
  const licence = await licencesService.getLicenceById(licenceId);
  if (!licence) {
    return Boom.notFound(`Licence ${licenceId} not found`);
  }
  return documentsService.getValidDocumentOnDate(licence.licenceNumber, date);
};

const getLicencesWithoutChargeVersions = async () => {
  const licences = await licencesService.getLicencesWithoutChargeVersions();

  const promises = licences.map(licence => {
    return documentsService.getValidDocumentOnDate(licence.licenceNumber, licence.startDate)
      .then(document => {
        return document
          ? document.roles.find(role => role.isRoleName('licenceHolder'))
          : null;
      })
      .then(role => ({ licence, role }));
  });

  const licencesWithLicenceHolderRole = await Promise.all(promises);
  return { data: licencesWithLicenceHolderRole };
};

exports.getLicence = getLicence;
exports.getLicenceVersions = getLicenceVersions;
exports.getLicenceAccountsByRefAndDate = getLicenceAccountsByRefAndDate;
exports.getLicenceDocument = getLicenceDocument;
exports.getValidLicenceDocumentByDate = getValidLicenceDocumentByDate;
exports.getLicencesWithoutChargeVersions = getLicencesWithoutChargeVersions;
