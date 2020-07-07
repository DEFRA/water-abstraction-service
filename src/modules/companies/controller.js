const returnsConnector = require('../../lib/connectors/returns');
const documentsConnector = require('../../lib/connectors/crm/documents');

const documentsHelper = require('./lib/documents');
const returnsHelper = require('./lib/returns');
const invoiceAccountsHelper = require('./lib/invoice-accounts');

const crmConnectors = require('../../lib/connectors/crm-v2');
const Boom = require('@hapi/boom');

const { isEmpty } = require('lodash');

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
  const { companyId } = request.params;
  const company = await crmConnectors.companies.getCompany(companyId);
  if (company) return company;
  throw Boom.notFound(`Company ${companyId} not found`);
};

/**
 * Gets all addresses for a company
 */
const getCompanyAddresses = async (request, h) => {
  const { companyId } = request.params;
  const companyAddresses = await crmConnectors.companies.getCompanyAddresses(companyId);
  if (!isEmpty(companyAddresses)) return companyAddresses;
  throw Boom.notFound(`Addresses for company ${companyId} not found`);
};

/**
 * Creates new agent company, address, and/or contact, as required
 * Creates new invoice account and links relevant roles to it
 */
const createCompanyInvoiceAccount = async (request, h) => {
  const { address, agent, contact } = await invoiceAccountsHelper.getInvoiceAccountEntities(request.payload);

  const invoiceAccount = await invoiceAccountsHelper.createInvoiceAccountAndRoles(request, address, agent, contact);

  return invoiceAccountsHelper.getNewEntities(invoiceAccount, address, agent, contact);
};

exports.getReturns = getReturns;
exports.getCompany = getCompany;
exports.getCompanyAddresses = getCompanyAddresses;
exports.createCompanyInvoiceAccount = createCompanyInvoiceAccount;
