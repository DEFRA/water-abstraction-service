'use strict';

const urlJoin = require('url-join');
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../../config');

const getUri = (...tail) => urlJoin(config.services.crm_v2, 'invoice-accounts', ...tail);

/**
 * Gets the invoice accounts including company data
 * for the given for the given invoice account ids
 * @param {Array<String>} invoiceAccountids The array of invoice account ids to fetch
 */
const getInvoiceAccountsByIds = ids => {
  return serviceRequest.get(getUri(), {
    qs: { id: ids },
    qsStringifyOptions: { arrayFormat: 'repeat' }
  });
};

exports.getInvoiceAccountsByIds = getInvoiceAccountsByIds;
