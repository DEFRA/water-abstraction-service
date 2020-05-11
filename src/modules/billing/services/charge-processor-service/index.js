const { sortBy, last } = require('lodash');
const moment = require('moment');

const validators = require('../../../../lib/models/validators');
const { NotFoundError } = require('../../../../lib/errors');

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
]).format('YYYY-MM-DD');

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
  return mappers.address.crmToModel(lastAddress.address);
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

const getDocumentByDate = async (chargeVersion, chargePeriodStartDate) => {
  const { licenceNumber } = chargeVersion.licence;

  // Load all CRM documents for licence
  const result = await crmV2.documents.getDocuments(licenceNumber);
  const documents = result || [];

  const document = dateHelpers.findByDate(documents, chargePeriodStartDate);

  if (!document) {
    throw new NotFoundError(`Document not found in CRM for ${licenceNumber} on ${chargePeriodStartDate}`); ;
  }
  return document;
};

/**
 * Gets CRM licence holder role for charge version or throws NotFoundError
 * @param {ChargeVersion} chargeVersion
 * @param {String} chargePeriodStartDate - YYYY-MM-DD
 * @return {Promise<Object>} CRM role data
 */
const getLicenceHolderRole = async (chargeVersion, chargePeriodStartDate) => {
  const { licenceNumber } = chargeVersion.licence;

  const { documentId } = await getDocumentByDate(chargeVersion, chargePeriodStartDate);

  // Load document roles for relevant document, and filter to find
  // the licence holder role at the start of the charge period
  const document = await crmV2.documents.getDocument(documentId);

  if (!document) {
    throw new NotFoundError(`Document ${documentId} not found in CRM`); ;
  }

  const role = dateHelpers.findByDate(
    document.documentRoles.filter(role => role.roleName === 'licenceHolder'),
    chargePeriodStartDate
  );
  if (!role) {
    throw new NotFoundError(`Licence holder role not found in CRM for document ${documentId} on ${chargePeriodStartDate}`);
  }
  return role;
};

/**
 * Gets CRM company for charge version or throws NotFoundError
 * @param {ChargeVersion} chargeVersion
 * @return {Promise<Object>}
 */
const getCompany = async chargeVersion => {
  const { id } = chargeVersion.company;
  const company = await crmV2.companies.getCompany(id);
  if (!company) {
    throw new NotFoundError(`Company ${id} not found in CRM`);
  }
  return company;
};

/**
 * Gets CRM invoice account for charge version or throws NotFoundError
 * @param {ChargeVersion} chargeVersion
 * @return {Promise<Object>}
 */
const getInvoiceAccount = async chargeVersion => {
  const { id } = chargeVersion.invoiceAccount;
  const invoiceAccount = await crmV2.invoiceAccounts.getInvoiceAccountById(id);
  if (!invoiceAccount) {
    throw new NotFoundError(`Invoice account ${id} not found in CRM`);
  }
  return invoiceAccount;
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
  if (!chargeVersion) {
    throw new NotFoundError(`Charge version ${chargeVersionId} not found`);
  }

  // Get charge period start date
  const chargePeriodStartDate = getChargePeriodStartDate(financialYear, chargeVersion);

  // Load company/invoice account/licence holder data from CRM
  const [company, invoiceAccount, licenceHolderRole] = await Promise.all([
    getCompany(chargeVersion),
    getInvoiceAccount(chargeVersion),
    getLicenceHolderRole(chargeVersion, chargePeriodStartDate)
  ]);

  // Generate Invoice data structure
  const invoice = createInvoice(invoiceAccount);
  const invoiceLicence = createInvoiceLicence(company, chargeVersion, licenceHolderRole);
  invoiceLicence.transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion);
  invoice.invoiceLicences = [invoiceLicence];

  return invoice;
};

exports.processChargeVersionYear = processChargeVersionYear;
