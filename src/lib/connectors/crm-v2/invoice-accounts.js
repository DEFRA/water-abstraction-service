'use strict';

const { chunk, flatMap } = require('lodash');
const urlJoin = require('url-join');
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../../config');

const getUri = (...tail) => urlJoin(config.services.crm_v2, 'invoice-accounts', ...tail);

const getBatch = ids =>
  serviceRequest.get(getUri(), {
    qs: { id: ids },
    qsStringifyOptions: { arrayFormat: 'repeat' }
  });

/**
 * Gets the invoice accounts including company data
 * for the given for the given invoice account ids
 * @param {Array<String>} invoiceAccountids The array of invoice account ids to fetch
 */
const getInvoiceAccountsByIds = async ids => {
  // Split array into chunks to avoid exceeding max query limit of 1024
  const idBatches = chunk(ids, 24);
  // Get batches
  const results = await Promise.all(idBatches.map(getBatch));
  return flatMap(results);
};

/**
 * Gets an invoice account including company data for the given invoice account id
 * @param String id The invoice account id
 */
const getInvoiceAccountById = id => serviceRequest.get(getUri(id));

/**
 * Creates an invoice account entity in the CRM
 *
 * @param {Object} invoiceAccount The invoice account to persist
 */
const createInvoiceAccount = invoiceAccount => {
  return serviceRequest.post(getUri(), { body: invoiceAccount });
};

const deleteInvoiceAccount = async invoiceAccountId =>
  serviceRequest.delete(getUri(invoiceAccountId));

/**
 * Creates an invoice account address association to the invoice
 * account with the given invoice account id
 *
 * @param {String} invoiceAccountId The invoice account to associate the address with
 * @param {Object} invoiceAccountAddress The invoice account address to persist
 */
const createInvoiceAccountAddress = (invoiceAccountId, invoiceAccountAddress) => {
  const url = getUri(invoiceAccountId, 'addresses');
  return serviceRequest.post(url, { body: invoiceAccountAddress });
};

exports.createInvoiceAccount = createInvoiceAccount;
exports.deleteInvoiceAccount = deleteInvoiceAccount;
exports.createInvoiceAccountAddress = createInvoiceAccountAddress;
exports.getInvoiceAccountById = getInvoiceAccountById;
exports.getInvoiceAccountsByIds = getInvoiceAccountsByIds;
