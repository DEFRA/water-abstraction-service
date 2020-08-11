'use strict';

const Boom = require('@hapi/boom');

const documentsConnector = require('../../lib/connectors/crm/documents');
const licencesService = require('../../lib/services/licences');
const chargeElementsService = require('../../lib/services/charge-elements');
const chargeVersionsService = require('../../lib/services/charge-versions');

const ChargeVersion = require('../../lib/models/charge-version');
const Licence = require('../../lib/models/licence');
const Region = require('../../lib/models/region');
const DateRange = require('../../lib/models/date-range');
const Company = require('../../lib/models/company');
const InvoiceAccount = require('../../lib/models/invoice-account');

const getChargeVersionsByLicenceRef = async licenceRef => {
  const chargeVersions = await chargeVersionsService.getByLicenceRef(licenceRef);
  return { data: chargeVersions };
};

/**
 * Gets a list of charge versions for the specified licence number
 * @param  {String}  request.query.licenceRef - the licence number
 */
const getChargeVersions = async request => {
  return getChargeVersionsByLicenceRef(request.query.licenceRef);
};

/**
 * Gets a charge version complete with its elements and agreements
 * @param  {String}  request.params.versionId - the charge version ID
 */
const getChargeVersion = async request => {
  const { versionId } = request.params;

  const chargeVersion = await chargeVersionsService.getByChargeVersionId(versionId);

  return chargeVersion || Boom.notFound(`Charge agreement ${versionId} not found`);
};

const getChargeVersionsByDocumentId = async request => {
  const { documentId } = request.params;

  const { data: document } = await documentsConnector.getDocument(documentId, true);

  return getChargeVersionsByLicenceRef(document.system_external_id);
};

const getDefaultChargesForLicenceVersion = async request => {
  const { licenceVersionId } = request.params;

  const licenceVersion = await licencesService.getLicenceVersionById(licenceVersionId);

  return licenceVersion === null
    ? Boom.notFound('No licence version found')
    : chargeElementsService.getChargeElementsFromLicenceVersion(licenceVersion);
};

const postChargeVersion = async (request, h) => {
  const { payload } = request;
  let chargeVersion;

  try {
    chargeVersion = new ChargeVersion().fromHash({
      licence: new Licence().fromHash({ licenceNumber: payload.licenceNumber }),
      versionNumber: payload.versionNumber,
      dateRange: new DateRange(
        DateRange.formatDate(payload.startDate),
        DateRange.formatDate(payload.endDate)
      ),
      status: payload.status,
      apportionment: payload.apportionment,
      billedUpToDate: payload.billedUpToDate,
      region: new Region().fromHash({ numericCode: payload.regionCode }),
      company: new Company(payload.companyId),
      invoiceAccount: new InvoiceAccount(payload.invoiceAccountId),
      scheme: payload.scheme
    });
  } catch (err) {
    return Boom.badRequest('Failed to create ChargeVersion from payload', err);
  }

  const createdChargeVersion = await chargeVersionsService.createChargeVersion(chargeVersion);
  return h.response(createdChargeVersion).created(`/water/1.0/charge-versions/${createdChargeVersion.id}`);
};

exports.getChargeVersions = getChargeVersions;
exports.getChargeVersion = getChargeVersion;
exports.getChargeVersionsByDocumentId = getChargeVersionsByDocumentId;
exports.getDefaultChargesForLicenceVersion = getDefaultChargesForLicenceVersion;
exports.postChargeVersion = postChargeVersion;
