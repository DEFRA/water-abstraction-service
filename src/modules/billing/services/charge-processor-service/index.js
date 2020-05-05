const { sortBy, last } = require('lodash');
const moment = require('moment');

const validators = require('../../../../lib/models/validators');

const Batch = require('../../../../lib/models/batch');
const FinancialYear = require('../../../../lib/models/financial-year');
const Invoice = require('../../../../lib/models/invoice');
const InvoiceLicence = require('../../../../lib/models/invoice-licence');

const dateHelpers = require('./lib/date-helpers');
const transactionsProcessor = require('./transactions-processor');

const mappers = require('../../mappers');

// Services
const chargeVersionService = require('../../services/charge-version-service');
const crmV2 = require('../../../../lib/connectors/crm-v2');

const getChargePeriodStartDate = (financialYear, chargeVersion) => dateHelpers.getMaxDate([
  chargeVersion.licence.startDate,
  financialYear.start,
  chargeVersion.dateRange.startDate
]);

/**
 * Given an array of invoice account addresses from CRM data,
 * gets the last one (sorted by start date) and return
 * as an Address service model
 * @param {Array<Object>} invoiceAccountAddresses
 * @return {Address}
 */
const getLastAddress = invoiceAccountAddresses => {
  const sorted = sortBy(invoiceAccountAddresses, row => {
    return moment(row.startDate).unix();
  });
  const lastAddress = last(sorted);
  return lastAddress && mappers.address.crmToModel(lastAddress.address);
};

/**
 * Creates an Invoice service model from CRM data
 * @param {Object} invoiceAccount - data from CRM
 * @return {Invoice}
 */
const createInvoice = invoiceAccount => {
  const invoice = new Invoice();
  return invoice.fromHash({
    invoiceAccount: mappers.invoiceAccount.crmToModel(invoiceAccount),
    address: getLastAddress(invoiceAccount.invoiceAccountAddresses)
  });
};

/**
 * Given CRM company data and the charge version being processed,
 * gets an InvoiceLicence instance
 * @param {Object} company - data from CRM
 * @param {ChargeVersion} chargeVersion
 */
const createInvoiceLicence = (company, chargeVersion, licenceHolderRole) => {
  const invoiceLicence = new InvoiceLicence();
  return invoiceLicence.fromHash({
    licence: chargeVersion.licence,
    company: mappers.company.crmToModel(company),
    contact: mappers.contact.crmToModel(licenceHolderRole.contact),
    address: mappers.address.crmToModel(licenceHolderRole.address)
  });
};

/**
 * Gets the licence holder role from the CRM for the licence p
 * on the specified date
 * @param {String} licenceNumber
 * @param {String} chargePeriodStartDate - YYYY-MM-DD
 * @return {Promise<Object>} CRM role data
 */
const getLicenceHolderRole = async (licenceNumber, chargePeriodStartDate) => {
  // Load all CRM documents for licence number
  const documents = await crmV2.documents.getDocuments(licenceNumber);
  const document = dateHelpers.findByDate(documents, chargePeriodStartDate);
  if (document) {
    // Load document roles for relevant document
    const { documentRoles } = await crmV2.documents.getDocument(document.documentId);
    return dateHelpers.findByDate(
      documentRoles.filter(role => role.roleName === 'licenceHolder'),
      chargePeriodStartDate
    );
  }
};

/**
 * Creates the invoice data structure for a given charge version year
 * @param {Batch} batch
 * @param {FinancialYear} financialYear
 * @param {String} chargeVersionId
 * @return {Promise<Invoice>}
 */
const processChargeVersionYear = async (batch, financialYear, chargeVersionId) => {
  validators.assertIsInstanceOf(batch, Batch);
  validators.assertIsInstanceOf(financialYear, FinancialYear);

  // Load ChargeVersion service model
  const chargeVersion = await chargeVersionService.getByChargeVersionId(chargeVersionId);

  // Get charge period start date
  const chargePeriodStartDate = getChargePeriodStartDate(financialYear, chargeVersion);

  // Load company/invoice account
  const [company, invoiceAccount, licenceHolderRole] = await Promise.all([
    crmV2.companies.getCompany(chargeVersion.company.id),
    crmV2.invoiceAccounts.getInvoiceAccountById(chargeVersion.invoiceAccount.id),
    getLicenceHolderRole(chargeVersion.licence.licenceNumber, chargePeriodStartDate)
  ]);

  // Generate Invoice data structure
  const invoice = createInvoice(invoiceAccount);
  const invoiceLicence = createInvoiceLicence(company, chargeVersion, licenceHolderRole);
  invoiceLicence.transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion);
  invoice.invoiceLicences = [invoiceLicence];

  return invoice;
};

exports.processChargeVersionYear = processChargeVersionYear;
