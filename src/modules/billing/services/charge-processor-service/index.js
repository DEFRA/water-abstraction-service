'use strict';

const validators = require('../../../../lib/models/validators');

const ChargeVersionYear = require('../../../../lib/models/charge-version-year');
const Batch = require('../../../../lib/models/batch');
const ChargeVersion = require('../../../../lib/models/charge-version');
const FinancialYear = require('../../../../lib/models/financial-year');
const InvoiceLicence = require('../../../../lib/models/invoice-licence');

const transactionsProcessor = require('./transactions-processor');

const mappers = require('../../mappers');

// Services
const billingVolumesService = require('../../services/billing-volumes-service');

// Connectors
const invoiceAccountsConnector = require('../../../../lib/connectors/crm-v2/invoice-accounts');

/**
 * Given CRM company data and the charge version being processed,
 * gets an InvoiceLicence instance
 * @param {Object} company - data from CRM
 * @param {ChargeVersion} chargeVersion
 */
const createInvoiceLicence = (chargeVersion) => {
  const invoiceLicence = new InvoiceLicence();
  return invoiceLicence.fromHash({
    licence: chargeVersion.licence
  });
};

const createTransactions = async (chargeVersionYear) => {
  if (chargeVersionYear.transactionType === ChargeVersionYear.TRANSACTION_TYPE.annual) {
    return transactionsProcessor.createTransactions(chargeVersionYear);
  }

  const { chargeVersion, financialYear } = chargeVersionYear;
  // Load all billing volumes relating to the charge elements and financial year
  // For supplementary these could have been generated by a previous TPT batch, not the current batch
  // There could also be multiple billing volumes per element - for summer and winter/all year TPT batches
  const billingVolumes = await billingVolumesService.getVolumesForChargeElements(chargeVersion.chargeElements, financialYear);
  return transactionsProcessor.createTransactions(chargeVersionYear, billingVolumes);
};

/**
 * Validate that all required models are present
 * @param {ChargeVersionYear} chargeVersionYear
 */
const validateData = chargeVersionYear => {
  validators.assertIsInstanceOf(chargeVersionYear, ChargeVersionYear);
  validators.assertIsInstanceOf(chargeVersionYear.batch, Batch);
  validators.assertIsInstanceOf(chargeVersionYear.chargeVersion, ChargeVersion);
  validators.assertIsInstanceOf(chargeVersionYear.financialYear, FinancialYear);
};

/**
 * Creates the invoice data structure for a given charge version year
 * @param {ChargeVersionYear} chargeVersionYear contains batch and chargeVersion
 * @return {Promise<Invoice>}
 */
const processChargeVersionYear = async (chargeVersionYear) => {
  validateData(chargeVersionYear);

  const { chargeVersion, financialYear } = chargeVersionYear;
  const invoiceAccount = await invoiceAccountsConnector.getInvoiceAccountById(chargeVersion.invoiceAccount.id);
  // Generate Invoice data structure
  const invoice = mappers.invoice.crmToModel(invoiceAccount);
  invoice.financialYear = financialYear;
  const invoiceLicence = createInvoiceLicence(chargeVersion);
  invoiceLicence.transactions = await createTransactions(chargeVersionYear);
  invoice.invoiceLicences = [invoiceLicence];

  return invoice;
};

exports.processChargeVersionYear = processChargeVersionYear;
