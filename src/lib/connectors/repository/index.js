'use strict'

const { pool } = require('../db')

const ChargeElementRepository = require('./ChargeElementRepository')
const ChargeAgreementRepository = require('./ChargeAgreementRepository')
const BillingInvoiceRepository = require('./BillingInvoiceRepository')
const BillingInvoiceLicenceRepository = require('./BillingInvoiceLicenceRepository')
const BillingBatchChargeVersionYearsRepository = require('./BillingBatchChargeVersionYearsRepository')
const LicenceRepository = require('./LicenceRepository')
const LicenceAgreementRepository = require('./LicenceAgreementRepository')

const chargeElements = new ChargeElementRepository({
  connection: pool,
  table: 'water.charge_elements',
  primaryKey: 'charge_element_id'
})

const chargeAgreements = new ChargeAgreementRepository({
  connection: pool,
  table: 'water.charge_agreements',
  primaryKey: 'charge_agreement_id'
})

exports.chargeElements = chargeElements
exports.chargeAgreements = chargeAgreements
exports.billingInvoices = new BillingInvoiceRepository()
exports.billingInvoiceLicences = new BillingInvoiceLicenceRepository()
exports.billingBatchChargeVersionYears = new BillingBatchChargeVersionYearsRepository()
exports.licences = new LicenceRepository()
exports.licenceAgreements = new LicenceAgreementRepository()
