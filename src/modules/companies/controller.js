'use strict';

const returnsConnector = require('../../lib/connectors/returns');
const documentsConnector = require('../../lib/connectors/crm/documents');
const companyContactsService = require('../../lib/services/company-contacts');

const documentsHelper = require('./lib/documents');
const returnsHelper = require('./lib/returns');
const companiesService = require('../../lib/services/companies-service');
const invoiceAccountsService = require('../../lib/services/invoice-accounts-service');

const mapErrorResponse = require('../../lib/map-error-response');
const { envelope } = require('../../lib/response');

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
 * Gets an array of companies by name, with a soft search option
 * @param {String} name
 * @param {boolean} soft
 * */
const searchCompaniesByName = async (request, h) => {
  try {
    return companiesService.searchCompaniesByName(request.query.name, request.query.soft);
  } catch (err) {
    return mapErrorResponse(err);
  };
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
  const { startDate, regionId, address, agent, contact } = request.payload;
  const { companyId } = request.params;
  try {
    const invoiceAccount = invoiceAccountsService.getInvoiceAccount(companyId, startDate, address, agent, contact);

    const persistedAccount = await invoiceAccountsService.persist(regionId, startDate, invoiceAccount);

    // Create BullMQ message to update the invoice account in CM
    const { jobName: updateCustomerDetailsInCMJobName } = require('../../modules/billing/jobs/update-customer');
    await request.queueManager.add(updateCustomerDetailsInCMJobName, persistedAccount.id);
    const generatedAccount = await invoiceAccountsService.getByInvoiceAccountId(persistedAccount.id);

    return h.response(generatedAccount.toJSON()).code(201);
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

const getCompanyInvoiceAccounts = async request => {
  const { companyId } = request.params;
  const { regionId } = request.query;

  try {
    const invoiceAccounts = await companiesService.getCompanyInvoiceAccounts(companyId, regionId);
    return envelope(invoiceAccounts);
  } catch (err) {
    return mapErrorResponse(err);
  }
};

exports.getReturns = getReturns;
exports.getCompany = getCompany;
exports.searchCompaniesByName = searchCompaniesByName;
exports.getCompanyAddresses = getCompanyAddresses;
exports.createCompanyInvoiceAccount = createCompanyInvoiceAccount;
exports.getCompanyContacts = getCompanyContacts;
exports.getCompanyInvoiceAccounts = getCompanyInvoiceAccounts;
