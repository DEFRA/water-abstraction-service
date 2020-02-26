const { pool } = require('../db');
const ChargeVersionRepository = require('./ChargeVersionRepository');
const ChargeElementRepository = require('./ChargeElementRepository');
const ChargeAgreementRepository = require('./ChargeAgreementRepository');
const BillingBatchRepository = require('./BillingBatchRepository');
const BillingInvoiceRepository = require('./BillingInvoiceRepository');
const BillingInvoiceLicenceRepository = require('./BillingInvoiceLicenceRepository');
const BillingTransactionRepository = require('./BillingTransactionRepository');
const BillingBatchChargeVersionYearsRepository = require('./BillingBatchChargeVersionYearsRepository');
const BillingBatchChargeVersionsRepository = require('./BillingBatchChargeVersionsRepository');
const LicenceRepository = require('./LicenceRepository');
const LicenceAgreementRepository = require('./LicenceAgreementRepository');

const chargeVersions = new ChargeVersionRepository({
  connection: pool,
  table: 'water.charge_versions',
  primaryKey: 'charge_version_id'
});

const chargeElements = new ChargeElementRepository({
  connection: pool,
  table: 'water.charge_elements',
  primaryKey: 'charge_element_id'
});

const chargeAgreements = new ChargeAgreementRepository({
  connection: pool,
  table: 'water.charge_agreements',
  primaryKey: 'charge_agreement_id'
});

exports.chargeVersions = chargeVersions;
exports.chargeElements = chargeElements;
exports.chargeAgreements = chargeAgreements;
exports.billingBatches = new BillingBatchRepository();
exports.billingInvoices = new BillingInvoiceRepository();
exports.billingInvoiceLicences = new BillingInvoiceLicenceRepository();
exports.billingTransactions = new BillingTransactionRepository();
exports.billingBatchChargeVersionYears = new BillingBatchChargeVersionYearsRepository();
exports.billingBatchChargeVersions = new BillingBatchChargeVersionsRepository();
exports.licences = new LicenceRepository();
exports.licenceAgreements = new LicenceAgreementRepository();
