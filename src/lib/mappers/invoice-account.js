'use strict'
const moment = require('moment')

const InvoiceAccount = require('../models/invoice-account')
const DateRange = require('../models/date-range')

const companyMapper = require('./company')
const invoiceAccountAddressMapper = require('./invoice-account-address')
const dateRangeMapper = require('./date-range')
const { createMapper } = require('../object-mapper')
const { createModel } = require('./lib/helpers')
/**
 * Maps CRM invoice account and (optionally) company data to a water service model
 * @param {Object} invoiceAccount - CRM invoice account data
 * @param {Object} company - CRM company data
 * @return {InvoiceAccount}
 */
const crmToModel = invoiceAccount => {
  const invoiceAccountModel = new InvoiceAccount(invoiceAccount.invoiceAccountId)
  invoiceAccountModel.fromHash({
    dateRange: new DateRange(invoiceAccount.startDate, invoiceAccount.endDate),
    dateCreated: moment(invoiceAccount.dateCreated).format('YYYY-MM-DD'),
    accountNumber: invoiceAccount.invoiceAccountNumber,
    company: companyMapper.crmToModel(invoiceAccount.company),
    lastTransactionFileReference: invoiceAccount.lastTransactionFileReference,
    dateLastTransactionFileReferenceUpdated: moment(invoiceAccount.dateLastTransactionFileReferenceUpdated).format('YYYY-MM-DD')
  })

  if (invoiceAccount.invoiceAccountAddresses) {
    invoiceAccountModel.invoiceAccountAddresses = invoiceAccount.invoiceAccountAddresses.map(invoiceAccountAddressMapper.crmToModel)
  }

  return invoiceAccountModel
}

const pojoToModelMapper = createMapper()
  .copy(
    'id',
    'accountNumber',
    'dateCreated',
    'lastTransactionFileReference',
    'dateLastTransactionFileReferenceUpdated'
  )
  .map('company').to('company', companyMapper.pojoToModel)
  .map('dateRange').to('dateRange', dateRangeMapper.pojoToModel)
  .map('invoiceAccountAddresses').to('invoiceAccountAddresses',
    invoiceAccountAddresses => invoiceAccountAddresses.map(invoiceAccountAddressMapper.pojoToModel))

/**
 * Converts a plain object representation of a InvoiceAccount to a InvoiceAccount model
 * @param {Object} pojo
 * @return InvoiceAccount
 */
const pojoToModel = pojo => createModel(InvoiceAccount, pojo, pojoToModelMapper)

exports.crmToModel = crmToModel
exports.pojoToModel = pojoToModel
