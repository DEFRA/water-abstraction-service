const waterServiceRepos = require('../../../lib/connectors/repos');
const crmConnectors = require('../../../lib/connectors/crm-v2');

const invoiceAccountsValidators = require('../validators/invoice-accounts');

const getAgentCompany = async agent =>
  agent.companyId ? agent : await crmConnectors.companies.createCompany(agent);

const getInvoiceAccountEntities = async payload => {
  const { address, agent, contact } = payload;

  invoiceAccountsValidators.validateAddress(address);
  invoiceAccountsValidators.validateAgentCompany(agent);
  invoiceAccountsValidators.validateContact(contact);

  return {
    address: address.addressId ? address : await crmConnectors.addresses.createAddress(address),
    agent: agent ? await getAgentCompany(agent) : null,
    contact: contact.contactId ? contact : await crmConnectors.contacts.createContact(contact)
  };
};

const hasMultipleKeys = object => {
  const keys = Object.keys(object);
  return keys.length > 1;
};

/**
 * Creates new invoice account and invoice account address
 * to link relevant roles to the invoice account
 */
const createInvoiceAccountAndRoles = async (request, agent, address, contact) => {
  const { companyId } = request.params;
  const { startDate, regionId } = request.payload;

  const { chargeRegionId: regionCode } = await waterServiceRepos.regions.findOne(regionId);

  const invoiceAccount = await crmConnectors.invoiceAccounts.createInvoiceAccount({
    companyId,
    regionCode,
    startDate
  });

  const invoiceAccountRoles = {
    startDate,
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
    if (hasMultipleKeys(value)) newEntities[key] = value;
  }

  return newEntities;
};

exports.getInvoiceAccountEntities = getInvoiceAccountEntities;
exports.createInvoiceAccountAndRoles = createInvoiceAccountAndRoles;
exports.getNewEntities = getNewEntities;
