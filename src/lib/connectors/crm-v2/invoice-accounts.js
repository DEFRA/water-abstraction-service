'use strict'

const { chunk, flatMap } = require('lodash')
const { serviceRequest, urlJoin } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')

const getPluralisedUri = (...tail) => urlJoin(config.services.crm_v2, 'invoice-accounts', ...tail)
const getSingularUri = (...tail) => urlJoin(config.services.crm_v2, 'invoice-account', ...tail)

const getBatch = ids =>
  serviceRequest.get(getPluralisedUri(), {
    qs: { id: ids },
    qsStringifyOptions: { arrayFormat: 'repeat' }
  })

/**
 * Gets the invoice accounts including company data
 * for the given for the given invoice account ids
 * @param {Array<String>} invoiceAccountids The array of invoice account ids to fetch
 */
const getInvoiceAccountsByIds = async ids => {
  // Split array into chunks to avoid exceeding max query limit of 1024
  const idBatches = chunk(ids, 24)
  // Get batches
  const results = await Promise.all(idBatches.map(getBatch))
  return flatMap(results)
}

/**
 * Gets an invoice account including company data for the given invoice account id
 * @param String id The invoice account id
 */
const getInvoiceAccountById = id => serviceRequest.get(getPluralisedUri(id))

/**
 * Creates an invoice account entity in the CRM
 *
 * @param {Object} invoiceAccount The invoice account to persist
 */
const createInvoiceAccount = invoiceAccount => {
  return serviceRequest.post(getPluralisedUri(), { body: invoiceAccount })
}

const deleteInvoiceAccount = async invoiceAccountId =>
  serviceRequest.delete(getPluralisedUri(invoiceAccountId))

/**
 * Creates an invoice account address association to the invoice
 * account with the given invoice account id
 *
 * @param {String} invoiceAccountId The invoice account to associate the address with
 * @param {Object} invoiceAccountAddress The invoice account address to persist
 */
const createInvoiceAccountAddress = (invoiceAccountId, invoiceAccountAddress) => {
  const url = getPluralisedUri(invoiceAccountId, 'addresses')
  return serviceRequest.post(url, { body: invoiceAccountAddress })
}

/**
 * Fetches invoice account IDs where the entities hashes do not match
 *
 */
const fetchInvoiceAccountsWithUpdatedEntities = () => {
  const url = getPluralisedUri('recently-updated')
  return serviceRequest.get(url)
}

const getInvoiceAccountByRef = ref => serviceRequest.get(getSingularUri(), { qs: { ref } })

const updateInvoiceAccountsWithCustomerFileReference = (fileReference, exportedAt, exportedCustomers) => {
  const url = getPluralisedUri('customer-file-references')
  return serviceRequest.post(url, {
    body: {
      fileReference,
      exportedAt,
      exportedCustomers
    }
  })
}

exports.createInvoiceAccount = createInvoiceAccount
exports.deleteInvoiceAccount = deleteInvoiceAccount
exports.createInvoiceAccountAddress = createInvoiceAccountAddress
exports.getInvoiceAccountById = getInvoiceAccountById
exports.getInvoiceAccountsByIds = getInvoiceAccountsByIds
exports.fetchInvoiceAccountsWithUpdatedEntities = fetchInvoiceAccountsWithUpdatedEntities
exports.getInvoiceAccountByRef = getInvoiceAccountByRef
exports.updateInvoiceAccountsWithCustomerFileReference = updateInvoiceAccountsWithCustomerFileReference
