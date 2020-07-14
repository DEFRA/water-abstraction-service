'use strict';

const invoiceAccountsConnector = require('../connectors/crm-v2/invoice-accounts');
const companiesService = require('./companies-service');
const addressesService = require('./addresses-service');
const contactsService = require('./contacts-service');
const regionsService = require('./regions-service');
const invoiceAccountsValidators = require('../../modules/companies/validators/invoice-accounts');
const mappers = require('../mappers');

const moment = require('moment');
const { omit } = require('lodash');

/**
 * Gets invoice accounts with specified IDs from CRM and
 * returns as an array of InvoiceAccount models
 * @param {Array<String>} ids - GUIDs for CRM invoice account IDs
 * @return {Promise<Array>}
 */
const getByInvoiceAccountIds = async (ids = []) => {
  if (ids.length === 0) {
    return [];
  }

  const invoiceAccounts = await invoiceAccountsConnector.getInvoiceAccountsByIds(ids);

  return invoiceAccounts.map(invoiceAccount =>
    mappers.invoiceAccount.crmToModel(invoiceAccount)
  );
};

/**
 * Gets the invoice accounts with the specified ID from CRM and
 * returns as an InvoiceAccount model
 * @param String id - GUID for CRM invoice account ID
 * @return {Promise<InvoiceAccount>}
 */
const getByInvoiceAccountId = async id => {
  const invoiceAccount = await invoiceAccountsConnector.getInvoiceAccountById(id);
  return mappers.invoiceAccount.crmToModel(invoiceAccount);
};

const createInvoiceAccount = async request => {
  const { companyId } = request.params;
  const { startDate, regionId } = request.payload;

  const regionCode = await regionsService.getRegionCode(regionId);

  const invoiceAccount = await invoiceAccountsConnector.createInvoiceAccount({
    companyId,
    regionCode,
    startDate: formatDate(startDate)
  });

  return mappers.invoiceAccount.crmToModel(invoiceAccount);
};

/**
 * get companyId of company which the new address is to be linked
 *   if there is an agent, link to agent,
 *   otherwise, link to licenceHolder company
 */
const getCompanyIdForEntity = (request, agentCompany) => {
  const { agent } = request.payload;
  if (agent) {
    return isNewEntity(agent) ? agentCompany.id : agent.companyId;
  }
  return request.params.companyId;
};

const formatDate = date => moment(date).format('YYYY-MM-DD');

const getData = payload => ({
  roleName: payload.agent ? 'billing' : 'licenceHolder',
  isDefault: true,
  startDate: formatDate(payload.startDate)
});

const createCompanyAddress = async (request, newAddress, agentCompany) => {
  const companyId = getCompanyIdForEntity(request, agentCompany);
  const data = {
    addressId: newAddress.id,
    ...getData(request.payload)
  };

  return companiesService.createCompanyAddress(companyId, data);
};

const createCompanyContact = async (request, newContact, agentCompany) => {
  const companyId = getCompanyIdForEntity(request, agentCompany);
  const data = {
    contactId: newContact.id,
    ...getData(request.payload)
  };
  const companyContact = await companiesService.createCompanyContact(companyId, data);
  return companyContact;
};

const getAgentCompany = async agent => {
  if (agent.companyId) return agent;
  return companiesService.createCompany(mappers.company.serviceToCrm(agent));
};

const validators = {
  address: invoiceAccountsValidators.validateAddress,
  agent: invoiceAccountsValidators.validateAgentCompany,
  contact: invoiceAccountsValidators.validateContact
};

const validatePayloadEntities = payload => {
  const entities = omit(payload, 'startDate', 'regionId');

  for (const [key, value] of Object.entries(entities)) {
    const { error } = validators[key](value);
    if (error) throw error;
  }
};

const getInvoiceAccountEntities = async request => {
  const { address, agent, contact } = request.payload;

  validatePayloadEntities(request.payload);

  const addressEntity = address.addressId ? address : await addressesService.createAddress(address);
  const agentCompany = agent ? await getAgentCompany(agent) : null;
  const contactEntity = contact.contactId ? contact : await contactsService.createContact(contact);

  if (isNewEntity(address)) await createCompanyAddress(request, addressEntity, agentCompany);
  if (isNewEntity(contact)) await createCompanyContact(request, contactEntity, agentCompany);

  return {
    address: addressEntity,
    agent: agentCompany,
    contact: contactEntity
  };
};

/**
 * Creates new invoice account and invoice account address
 * to link relevant roles to the invoice account
 */
const createInvoiceAccountAddress = async (request, invoiceAccount, address, agent, contact) => {
  const { startDate } = request.payload;
  const data = {
    startDate: formatDate(startDate),
    addressId: address.addressId || address.id,
    agentCompanyId: agent ? agent.companyId || agent.id : null,
    contactId: contact.contactId || contact.id
  };

  const invoiceAccountAddress = await invoiceAccountsConnector.createInvoiceAccountAddress(invoiceAccount.id, data);

  return mappers.invoiceAccountAddress.crmToModel(invoiceAccountAddress);
};

/**
 * Checks whether the entity is new by looking at the number of keys
 * NB: Exisiting entities only have the id key
 */
const isNewEntity = entity => {
  if (!entity) return false;
  const keys = Object.keys(entity);
  return keys.length > 1;
};

/**
 * Returns only newly created objects
 *  Existing objects will only contain the object id
 * @param {Object} invoiceAccount
 * @param {Object} agent
 * @param {Object} address
 * @param {Object} contact
 * @return {Object} containing newly created entities
 */
const getNewEntities = (invoiceAccount, address, agent, contact) => {
  const newEntities = { invoiceAccount };
  const entities = { address, agent, contact };

  for (const [key, value] of Object.entries(entities)) {
    if (isNewEntity(value)) newEntities[key] = value;
  }

  return newEntities;
};

exports.getByInvoiceAccountIds = getByInvoiceAccountIds;
exports.getByInvoiceAccountId = getByInvoiceAccountId;
exports.getInvoiceAccountEntities = getInvoiceAccountEntities;
exports.createInvoiceAccount = createInvoiceAccount;
exports.createInvoiceAccountAddress = createInvoiceAccountAddress;
exports.getNewEntities = getNewEntities;
