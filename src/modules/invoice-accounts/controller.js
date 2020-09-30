'use strict';

const controller = require('../../lib/controller');
const invoiceAccountService = require('../../lib/services/invoice-accounts-service');

/**
 * Gets an invoice account for the specified ID
 * Also returns addresses for the invoice account if any exist
 */
const getInvoiceAccount = async request =>
  controller.getEntity(request.params.invoiceAccountId, invoiceAccountService.getByInvoiceAccountId);

exports.getInvoiceAccount = getInvoiceAccount;
