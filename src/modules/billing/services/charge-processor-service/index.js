const { sortBy, last } = require('lodash');
const moment = require('moment');

const validators = require('../../../../lib/models/validators');
const { NotFoundError } = require('../../../../lib/errors');

const Batch = require('../../../../lib/models/batch');
const FinancialYear = require('../../../../lib/models/financial-year');
const Invoice = require('../../../../lib/models/invoice');
const InvoiceLicence = require('../../../../lib/models/invoice-licence');

const dateHelpers = require('./lib/date-helpers');
const crmHelpers = require('./lib/crm-helpers');
const transactionsProcessor = require('./transactions-processor');

const mappers = require('../../mappers');

// Services
const chargeVersionService = require('../../services/charge-version-service');

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
  validators.assertId(chargeVersionId);

  // Load ChargeVersion service model
  const chargeVersion = await chargeVersionService.getByChargeVersionId(chargeVersionId);
  if (!chargeVersion) {
    throw new NotFoundError(`Charge version ${chargeVersionId} not found`);
  }

  // Get charge period start date
  const chargePeriodStartDate = getChargePeriodStartDate(financialYear, chargeVersion);

  // Load company/invoice account/licence holder data from CRM
  const [company, invoiceAccount, licenceHolderRole] = await crmHelpers.getCRMData(chargeVersion, chargePeriodStartDate);

  // Generate Invoice data structure
  const invoice = createInvoice(invoiceAccount);
  const invoiceLicence = createInvoiceLicence(company, chargeVersion, licenceHolderRole);
  invoiceLicence.transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion);
  invoice.invoiceLicences = [invoiceLicence];

  return invoice;
};

exports.processChargeVersionYear = processChargeVersionYear;
