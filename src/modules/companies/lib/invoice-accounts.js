const waterServiceRepos = require('../../../lib/connectors/repos');
const crmConnectors = require('../../../lib/connectors/crm-v2');

const invoiceAccountsValidators = require('../validators/invoice-accounts');
const moment = require('moment');
const { omit, startCase } = require('lodash');

const getAgentCompany = async agent => {
  if (agent.companyId) return agent;
  const data = {
    ...agent,
    type: agent.type === 'individual' ? 'person' : 'organisation',
    organisationType: agent.type
  };
  return crmConnectors.companies.createCompany(data);
};

/**
 * Checks whether the entity is new by looking at the number of keys
 * NB: Exisiting entities only have the id key
 */
const isNewEntity = entity => {
  const keys = Object.keys(entity);
  return keys.length > 1;
};

/**
 * get companyId of company which the new address is to be linked to
 */
const getCompanyIdForCompanyAddress = (request, agentCompany) => {
  const { agent } = request.payload;
  if (agent) {
    return isNewEntity(agent) ? agentCompany.companyId : agent.companyId;
  }
  return request.params.companyId;
};

/**
 * If a new address or contact is provided, it must be linked to the
 * licence holder or agent company before the invoice account is created
 */
const createCompanyAddressOrContact = async (request, newEntity, agentCompany, entityType) => {
  const { agent, startDate } = request.payload;
  const entityKey = `${entityType}Id`;
  const companyId = getCompanyIdForCompanyAddress(request, agentCompany);
  const method = `createCompany${startCase(entityType)}`;

  const data = {
    [entityKey]: newEntity[entityKey],
    roleName: agent ? 'billing' : 'licenceHolder',
    isDefault: true,
    startDate: formatDate(startDate)
  };

  return crmConnectors.companies[method](companyId, data);
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

  const addressEntity = address.addressId ? address : await crmConnectors.addresses.createAddress(address);
  const agentCompany = agent ? await getAgentCompany(agent) : null;
  const contactEntity = contact.contactId ? contact : await crmConnectors.contacts.createContact(contact);

  if (isNewEntity(address)) await createCompanyAddressOrContact(request, addressEntity, agentCompany, 'address');
  if (isNewEntity(contact)) await createCompanyAddressOrContact(request, contactEntity, agentCompany, 'contact');

  return {
    address: addressEntity,
    agent: agentCompany,
    contact: contactEntity
  };
};

const formatDate = date => moment(date).format('YYYY-MM-DD');

/**
 * Creates new invoice account and invoice account address
 * to link relevant roles to the invoice account
 */
const createInvoiceAccountAndRoles = async (request, address, agent, contact) => {
  const { companyId } = request.params;
  const { startDate, regionId } = request.payload;

  const { chargeRegionId: regionCode } = await waterServiceRepos.regions.findOne(regionId);

  const invoiceAccount = await crmConnectors.invoiceAccounts.createInvoiceAccount({
    companyId,
    regionCode,
    startDate: formatDate(startDate)
  });

  const invoiceAccountRoles = {
    startDate: formatDate(startDate),
    addressId: address.addressId,
    agentCompanyId: agent ? agent.companyId : null,
    contactId: contact.contactId
  };

  await crmConnectors.invoiceAccounts.createInvoiceAccountAddress(invoiceAccount.invoiceAccountId, invoiceAccountRoles);

  return invoiceAccount;
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
  const entities = { address, contact };
  if (agent) entities.agent = agent;

  for (const [key, value] of Object.entries(entities)) {
    if (isNewEntity(value)) newEntities[key] = value;
  }

  return newEntities;
};

exports._createCompanyAddressOrContact = createCompanyAddressOrContact;
exports.getInvoiceAccountEntities = getInvoiceAccountEntities;
exports.createInvoiceAccountAndRoles = createInvoiceAccountAndRoles;
exports.getNewEntities = getNewEntities;
