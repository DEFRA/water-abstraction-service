'use strict'

const { serviceRequest, urlJoin } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')

const getUri = (...tail) => urlJoin(config.services.crm_v2, 'invoice-account-addresses', ...tail)

const deleteInvoiceAccountAddress = async invoiceAccountAddressId =>
  serviceRequest.delete(getUri(invoiceAccountAddressId))

const patchInvoiceAccountAddress = async (invoiceAccountAddressId, updates) =>
  serviceRequest.patch(getUri(invoiceAccountAddressId), { body: updates })

exports.deleteInvoiceAccountAddress = deleteInvoiceAccountAddress
exports.patchInvoiceAccountAddress = patchInvoiceAccountAddress
