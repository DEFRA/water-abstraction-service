'use strict';

const { isEmpty } = require('lodash');

const InvoiceAccount = require('../models/invoice-account');

const invoiceAccountsConnector = require('../connectors/crm-v2/invoice-accounts');
const invoiceAccountAddressesService = require('./invoice-account-addresses-service');
const companiesService = require('./companies-service');
const addressesService = require('./addresses-service');
const contactsService = require('./contacts-service');
const regionsService = require('./regions-service');
const crmService = require('./crm-service');
const mappers = require('../mappers');
const dates = require('../../lib/dates');

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

const deleteInvoiceAccount = async invoiceAccount =>
  invoiceAccountsConnector.deleteInvoiceAccount(invoiceAccount.id);

/**
 * get companyId of company which the new address is to be linked
 *   if there is an agent, link to agent,
 *   otherwise, link to licenceHolder company
 */
const getCompanyIdForEntity = (companyId, agentCompany) =>
  agentCompany ? agentCompany.id : companyId;

const getData = (agent, startDate) => ({
  roleName: agent ? 'billing' : 'licenceHolder',
  isDefault: true,
  startDate
});

const createCompanyAddress = async (companyId, data, addressId) =>
  companiesService.createCompanyAddress(companyId, { ...data, addressId });

const createCompanyContact = async (companyId, data, contactId) =>
  companiesService.createCompanyContact(companyId, { ...data, contactId });

const createCompanyAddressAndContact = async (companyId, startDate, invoiceAccount, newModels) => {
  const { address, agentCompany, contact } = invoiceAccount.invoiceAccountAddresses[0];
  const entityCompanyId = getCompanyIdForEntity(companyId, agentCompany);
  const commonData = getData(agentCompany, startDate);

  if (isNewEntity(address)) {
    const companyAddress = await createCompanyAddress(entityCompanyId, commonData, address.id);
    newModels.push(companyAddress);
  }

  if (isNewEntity(contact)) {
    const companyContact = await createCompanyContact(entityCompanyId, commonData, contact.id);
    newModels.push(companyContact);
  }
};

const getInvoiceAccountModel = (companyId, startDate, addressModel, agentCompanyModel, contactModel) => {
  const invoiceAccountModel = new InvoiceAccount();
  invoiceAccountModel.company = mappers.company.uiToModel({ companyId });
  invoiceAccountModel.invoiceAccountAddresses.push(
    invoiceAccountAddressesService.getInvoiceAccountAddressModel(dates.formatDate(startDate), addressModel, agentCompanyModel, contactModel));
  return invoiceAccountModel;
};

/**
 * Maps all of the data into the invoice account service model
 * @param {String} companyId guid
 * @param {String} startDate date YYYY-MM-DD
 * @param {Object} address containing only id or address data
 * @param {Object} agent containing only id or company data
 * @param {Object} contact containing only id or company data
 * @return {InvoiceAccount} containing all of the relevant data
 */
const getInvoiceAccount = (companyId, startDate, address, agent, contact) => {
  const addressModel = addressesService.getAddressModel(address);
  const agentCompanyModel = companiesService.getCompanyModel(agent);
  const contactModel = contactsService.getContactModel(contact);

  return getInvoiceAccountModel(companyId, startDate, addressModel, agentCompanyModel, contactModel);
};

const persistMethods = {
  address: addressesService.createAddress,
  agentCompany: companiesService.createCompany,
  contact: contactsService.createContact
};

const createEntityAndDecorateInvoiceAccount = async (invoiceAccount, newModels, entity, entityType) => {
  if (isNewEntity(entity)) {
    const newEntity = await persistMethods[entityType](entity);
    invoiceAccount.invoiceAccountAddresses[0][entityType] = newEntity;
    newModels.push(newEntity);
  };
};

const createInvoiceAccount = async (regionId, companyId, startDate, invoiceAccount, newModels) => {
  const { code: regionCode } = await regionsService.getRegion(regionId);
  const invoiceAccountEntity = await invoiceAccountsConnector.createInvoiceAccount({
    companyId,
    regionCode,
    startDate
  });

  invoiceAccount.id = invoiceAccountEntity.invoiceAccountId;
  invoiceAccount.accountNumber = invoiceAccountEntity.invoiceAccountNumber;

  newModels.push(invoiceAccount);
};

/**
 *
 * @param {String} regionId guid
 * @param {String} startDate date
 * @param {InvoiceAccount} invoiceAccount containing data to be persisted
 */
const persist = async (regionId, startDate, invoiceAccount) => {
  const { address, agentCompany, contact } = invoiceAccount.invoiceAccountAddresses[0];
  const formattedStartDate = dates.formatDate(startDate);
  const newModels = [];
  try {
    await createEntityAndDecorateInvoiceAccount(invoiceAccount, newModels, address, 'address');
    await createEntityAndDecorateInvoiceAccount(invoiceAccount, newModels, agentCompany, 'agentCompany');
    await createEntityAndDecorateInvoiceAccount(invoiceAccount, newModels, contact, 'contact');

    await createCompanyAddressAndContact(invoiceAccount.company.id, formattedStartDate, invoiceAccount, newModels);

    await createInvoiceAccount(regionId, invoiceAccount.company.id, formattedStartDate, invoiceAccount, newModels);

    const invoiceAccountAddress = await invoiceAccountAddressesService.createInvoiceAccountAddress(invoiceAccount, invoiceAccount.invoiceAccountAddresses[0], formattedStartDate);
    return invoiceAccount.fromHash({
      invoiceAccountAddresses: [invoiceAccountAddress]
    });
  } catch (err) {
    await crmService.deleteEntities(newModels);
    throw err;
  }
};

/**
 * Checks whether the entity has data in the model other than the id
 * NB: Exisiting entities only have the id key populated
 */
const isNewEntity = entity => {
  if (!entity) return false;
  const values = Object.values(entity);
  // remove the id if present
  if (entity.id) values.shift();
  return values.length > 0 && values.some(value => !isEmpty(value));
};

exports.getByInvoiceAccountIds = getByInvoiceAccountIds;
exports.getByInvoiceAccountId = getByInvoiceAccountId;
exports.deleteInvoiceAccount = deleteInvoiceAccount;
exports.getInvoiceAccount = getInvoiceAccount;
exports.persist = persist;
exports._isNewEntity = isNewEntity;
