'use strict';

const moment = require('moment');
const controller = require('../../lib/controller');
const invoiceAccountService = require('../../lib/services/invoice-accounts-service');
const licencesService = require('../../lib/services/licences');
const invoiceAccountAddressMapper = require('../../lib/mappers/invoice-account-address');
const mapErrorResponse = require('../../lib/map-error-response');
const { jobName: updateCustomerDetailsInCMJobName } = require('../../modules/billing/jobs/update-customer');
const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Gets an invoice account for the specified ID
 * Also returns addresses for the invoice account if any exist
 */
const getInvoiceAccount = async request =>
  controller.getEntity(request.params.invoiceAccountId, invoiceAccountService.getByInvoiceAccountId);

const postInvoiceAccountAddress = async (request, h) => {
  try {
    const { invoiceAccountId } = request.params;
    const { address, agentCompany, contact } = request.payload;

    // Change of date is always current date
    const startDate = moment().format(DATE_FORMAT);

    // Map supplied data to InvoiceAccountAddress service model
    const invoiceAccountAddress = invoiceAccountAddressMapper.pojoToModel({
      dateRange: {
        startDate,
        endDate: null
      },
      agentCompany,
      address,
      contact
    });

    const result = await invoiceAccountService.createInvoiceAccountAddress(invoiceAccountId, invoiceAccountAddress);

    // Create BullMQ message to update the invoice account in CM
    await request.queueManager.add(updateCustomerDetailsInCMJobName, invoiceAccountId);

    return result;
  } catch (err) {
    return mapErrorResponse(err);
  }
};

/**
 * Gets licences with a "current" charge version linked to the supplied
 * invoice account
 */
const getLicences = async (request, h) => {
  try {
    const { invoiceAccountId } = request.params;
    return licencesService.getLicencesByInvoiceAccountId(invoiceAccountId);
  } catch (err) {
    return mapErrorResponse(err);
  }
};

exports.getInvoiceAccount = getInvoiceAccount;
exports.postInvoiceAccountAddress = postInvoiceAccountAddress;
exports.getLicences = getLicences;
