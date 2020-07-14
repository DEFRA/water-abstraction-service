'use strict';

const returnsConnector = require('../../lib/connectors/returns');
const documentsConnector = require('../../lib/connectors/crm/documents');
const companyContactsService = require('../../lib/services/company-contacts');

const documentsHelper = require('./lib/documents');
const returnsHelper = require('./lib/returns');
const companiesService = require('../../lib/services/companies-service');
const invoiceAccountsService = require('../../lib/services/invoice-accounts-service');
const Boom = require('@hapi/boom');
const { NotFoundError } = require('../../lib/errors');
const { envelope } = require('../../lib/response');

// caters for error triggered in this service and 404s returned from the CRM
const isNotFoundError = err => err instanceof NotFoundError || err.statusCode === 404;

const mapErrorResponse = error => {
  if (isNotFoundError) {
    return Boom.notFound(error.message);
  }
  // Unexpected error
  throw error;
};

const rowMapper = ret => {
  const { purposes = [] } = ret.metadata;
  return {
    licenceNumber: ret.licence_ref,
    returnId: ret.return_id,
    startDate: ret.start_date,
    endDate: ret.end_date,
    frequency: ret.returns_frequency,
    returnRequirement: ret.return_requirement,
    status: ret.status,
    siteDescription: ret.metadata.description,
    purposes: purposes.map(purpose => {
      return purpose.alias || purpose.tertiary.description;
    })
  };
};

/**
 * Gets all returns for a company
 */
const getReturns = async (request, h) => {
  const { entityId } = request.params;

  // Get documents for the supplied company entity
  const documentsFilter = documentsHelper.createDocumentsFilter(entityId);
  const documents = await documentsConnector.findAll(documentsFilter);

  // Get returns matching the documents and other filter params supplied
  // in request GET params
  const returnsFilter = returnsHelper.createReturnsFilter(request, documents);
  const columms = [
    'return_id', 'licence_ref', 'start_date', 'end_date',
    'returns_frequency', 'return_requirement', 'status', 'metadata'
  ];
  const returns = await returnsConnector.returns.findAll(returnsFilter, null, columms);

  // Map returns
  return returns.map(rowMapper);
};

/**
 * Gets a company for the specified ID
 */
const getCompany = async (request, h) => {
  try {
    return companiesService.getCompany(request.params.companyId);
  } catch (err) {
    return mapErrorResponse(err);
  }
};

/**
 * Gets all addresses for a company
 */
const getCompanyAddresses = async (request, h) => {
  try {
    return companiesService.getCompanyAddresses(request.params.companyId);
  } catch (err) {
    return mapErrorResponse(err);
  }
};
/**
 * Creates new agent company, address, and/or contact, as required
 * Creates new invoice account and links relevant roles to it
 */
const createCompanyInvoiceAccount = async (request, h) => {
  try {
    const { address, agent, contact } = await invoiceAccountsService.getInvoiceAccountEntities(request);
    const invoiceAccount = await invoiceAccountsService.createInvoiceAccount(request);

    await invoiceAccountsService.createInvoiceAccountAddress(request, invoiceAccount, address, agent, contact);

    return invoiceAccountsService.getNewEntities(invoiceAccount, address, agent, contact);
  } catch (err) {
    return mapErrorResponse(err);
  }
};

const getCompanyContacts = async (request) => {
  const { companyId } = request.params;

  try {
    const companyContacts = await companyContactsService.getCompanyContacts(companyId);
    return envelope(companyContacts);
  } catch (err) {
    return mapErrorResponse(err);
  }
};

exports.getReturns = getReturns;
exports.getCompany = getCompany;
exports.getCompanyAddresses = getCompanyAddresses;
exports.createCompanyInvoiceAccount = createCompanyInvoiceAccount;
exports.getCompanyContacts = getCompanyContacts;
