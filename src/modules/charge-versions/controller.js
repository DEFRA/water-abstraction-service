const Boom = require('@hapi/boom');
const repository = require('../../lib/connectors/repository');
const mappers = require('./lib/mappers');
const documentsConnector = require('../../lib/connectors/crm/documents');

const getChargeVersionsByLicenceRef = async licenceRef => {
  const rows = await repository.chargeVersions.findByLicenceRef(licenceRef);
  return { data: mappers.mapRows(rows) };
};

/**
 * Gets a list of charge versions for the specified licence number
 * @param  {String}  request.query.licenceRef - the licence number
 */
const getChargeVersions = async request => {
  const { licenceRef } = request.query;
  return getChargeVersionsByLicenceRef(licenceRef);
};

/**
 * Gets a charge version complete with its elements and agreements
 * @param  {String}  request.params.versionId - the charge version ID
 */
const getChargeVersion = async request => {
  const { versionId } = request.params;

  // Load version, elements, agreements
  const tasks = [
    repository.chargeVersions.findOneById(versionId),
    repository.chargeElements.findByChargeVersionId(versionId),
    repository.chargeAgreements.findByChargeVersionId(versionId)
  ];

  const data = await Promise.all(tasks);

  if (!data[0]) {
    return Boom.notFound(`Charge agreement ${versionId} not found`);
  }

  return mappers.mapChargeVersion(...data);
};

const getChargeVersionsByDocumentId = async request => {
  const { documentId } = request.params;

  const { data: document } = await documentsConnector.getDocument(documentId);
  return getChargeVersionsByLicenceRef(document.system_external_id);
};

exports.getChargeVersions = getChargeVersions;
exports.getChargeVersion = getChargeVersion;
exports.getChargeVersionsByDocumentId = getChargeVersionsByDocumentId;
