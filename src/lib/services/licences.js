'use strict';

const repos = require('../connectors/repos');
const licenceMapper = require('../mappers/licence');
const invoiceLicenceMapper = require('../../modules/billing/mappers/invoice-licence');
const invoiceMapper = require('../../modules/billing/mappers/invoice');
const batchMapper = require('../../modules/billing/mappers/batch');
const invoiceAccountsMapper = require('../mappers/invoice-account');
const licenceVersionMapper = require('../mappers/licence-version');
const { INCLUDE_IN_SUPPLEMENTARY_BILLING } = require('../models/constants');

const service = require('./service');
const crmDocsConnector = require('../connectors/crm-v2/documents');
const crmCompaniesConnector = require('../connectors/crm-v2/companies');

/**
 * Gets a licence model by ID
 * @param {String} licenceId
 * @return {Promise<Licence>}
 */
const getLicenceById = async licenceId =>
  service.findOne(licenceId, repos.licences.findOne, licenceMapper);

/**
 * Finds a licence using the licence ref/number. Takes the region code
 * as well incase a licence has the same licence ref/number across
 * legacy regions
 *
 * @param {String} licenceRef
 * @param {Number} regionCode
 */
const getLicenceByLicenceRef = async (licenceRef, regionCode) => {
  const licences = await repos.licences.findOneByLicenceRef(licenceRef);
  const licence = licences.find(licence => licence.region.naldRegionId === +regionCode);

  return licence ? licenceMapper.dbToModel(licence) : null;
};

/**
 * Gets an array of licences by IDs
 * @param {Array<String>} licenceRefs
 * @return {Promise<Array>} array of Licence service models
 */
const getLicencesByLicenceRefs = licenceRefs =>
  service.findMany(licenceRefs, repos.licences.findByLicenceRef, licenceMapper);

const getLicenceVersions = async licenceId =>
  service.findMany(
    licenceId,
    repos.licenceVersions.findByLicenceId,
    licenceVersionMapper
  );

const getLicenceVersionById = async licenceVersionId =>
  service.findOne(
    licenceVersionId,
    repos.licenceVersions.findOne,
    licenceVersionMapper
  );

/**
 * Updates the includeInSupplementaryBilling value for the given licence ids
 *
 * @param {String} from The status to move from (yes, no, reprocess)
 * @param {String} to The status to move to (yes, no, reprocess)
 * @param  {...String} licenceIds One or many licences ids to update
 */
const updateIncludeInSupplementaryBillingStatus = async (from, to, ...licenceIds) => {
  for (const licenceId of licenceIds) {
    await repos.licences.updateIncludeLicenceInSupplementaryBilling(licenceId, from, to);
  }
};

/**
 * Sets the water.licences.include_in_supplementary_billing value
 * from reprocess to yes for situations where the batch has not got
 * through the the sent phase. This allows the licences to be picked up
 * in a future supplementary bill run.
 *
 * @param {String} batchId
 */
const updateIncludeInSupplementaryBillingStatusForUnsentBatch = batchId => {
  return repos.licences.updateIncludeInSupplementaryBillingStatusForBatch(
    batchId,
    INCLUDE_IN_SUPPLEMENTARY_BILLING.reprocess,
    INCLUDE_IN_SUPPLEMENTARY_BILLING.yes
  );
};

/**
 * Sets the water.licences.include_in_supplementary_billing value
 * from yes to no, then reprocess to yes for situations where the batch has
 * been sent and therefore the licences don't need to be includes in
 * a future supplementary bill run.
 *
 * @param {String} batchId
 */
const updateIncludeInSupplementaryBillingStatusForSentBatch = async batchId => {
  await repos.licences.updateIncludeInSupplementaryBillingStatusForBatch(
    batchId,
    INCLUDE_IN_SUPPLEMENTARY_BILLING.yes,
    INCLUDE_IN_SUPPLEMENTARY_BILLING.no
  );

  // use the unsent function to save writing the same logic twice, even though
  // the function name is a little misleading here.
  return updateIncludeInSupplementaryBillingStatusForUnsentBatch(batchId);
};

/**
 * Fetches the invoice accounts associated with a licence using the licence ref and date as input.
 * @todo move to invoice accounts service
 * @param {String} documentRef
 * @param {String} date
 */
const getLicenceAccountsByRefAndDate = async (documentRef, date) => {
  //  First, fetch the company ID from the CRM
  const { companyId } = await crmDocsConnector.getDocumentByRefAndDate(documentRef, date);

  //  Secondly, take the company ID and fetch the invoice accounts for that company from the CRM
  const invoiceAccounts = await crmCompaniesConnector.getInvoiceAccountsByCompanyId(companyId);

  //  Return the invoice accounts
  return invoiceAccounts ? invoiceAccounts.map(invoiceAccount => invoiceAccountsMapper.crmToModel(invoiceAccount)) : [];
};

/**
 * Ensures the specified licence is included in the next supplementary bill run
 * @param {String} licenceId
 */
const flagForSupplementaryBilling = licenceId =>
  repos.licences.update(licenceId, { includeInSupplementaryBilling: INCLUDE_IN_SUPPLEMENTARY_BILLING.yes });

/**
 * Retrieves the invoices associated with a licence
 * Used in the UI bills tab
 * @param {String} licenceId
 * @param {number} page
 * @param {number} perPage
 * @return {Promise<Licence>}
 */
const getLicenceInvoices = async (licenceId, page = 1, perPage = 10) => {
  const invoices = await repos.billingInvoiceLicences.findAll(licenceId, page, perPage);

  const mappedInvoices = invoices.data.map(row => {
    const temp = invoiceLicenceMapper.dbToModel(row);
    temp.invoice = invoiceMapper.dbToModel(row.billingInvoice);
    temp.batch = batchMapper.dbToModel(row.billingInvoice.billingBatch);

    return temp;
  });
  return { data: mappedInvoices, pagination: invoices.pagination };
};

/**
 * Gets licences which have a current charge version linked to the
 * specified invoice account ID
 *
 * @param {String} invoiceAccountId
 */
const getLicencesByInvoiceAccountId = async invoiceAccountId => {
  const licences = await repos.licences.findByInvoiceAccountId(invoiceAccountId);
  return {
    data: licences.map(licenceMapper.dbToModel)
  };
};

exports.getLicenceById = getLicenceById;
exports.getLicencesByLicenceRefs = getLicencesByLicenceRefs;
exports.getLicenceVersionById = getLicenceVersionById;
exports.getLicenceVersions = getLicenceVersions;
exports.getLicenceByLicenceRef = getLicenceByLicenceRef;
exports.getLicenceAccountsByRefAndDate = getLicenceAccountsByRefAndDate;
exports.updateIncludeInSupplementaryBillingStatus = updateIncludeInSupplementaryBillingStatus;
exports.updateIncludeInSupplementaryBillingStatusForUnsentBatch = updateIncludeInSupplementaryBillingStatusForUnsentBatch;
exports.updateIncludeInSupplementaryBillingStatusForSentBatch = updateIncludeInSupplementaryBillingStatusForSentBatch;
exports.flagForSupplementaryBilling = flagForSupplementaryBilling;
exports.getLicenceInvoices = getLicenceInvoices;
exports.getLicencesByInvoiceAccountId = getLicencesByInvoiceAccountId;
