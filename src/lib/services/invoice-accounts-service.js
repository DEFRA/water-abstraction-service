'use strict';

const { isEmpty } = require('lodash');
const promiseWaterfall = require('p-waterfall');

const InvoiceAccountAddress = require('../models/invoice-account-address');
const invoiceAccountsConnector = require('../connectors/crm-v2/invoice-accounts');
const invoiceAccountAddressesService = require('./invoice-account-addresses-service');
const companiesService = require('./companies-service');
const addressesService = require('./addresses-service');
const contactsService = require('./contacts-service');
const regionsService = require('./regions-service');
const mappers = require('../mappers');
const validators = require('../models/validators');
const { CONTACT_ROLES } = require('../models/constants');
const { logger } = require('../../logger');

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
 * Creates a new invoice account in the CRM
 * @param {String} regionId guid
 * @param {InvoiceAccount} invoiceAccount containing data to be persisted
 */
const createInvoiceAccount = async (regionId, invoiceAccount) => {
  const { code: regionCode } = await regionsService.getRegion(regionId);
  const invoiceAccountEntity = await invoiceAccountsConnector.createInvoiceAccount({
    companyId: invoiceAccount.company.id,
    regionCode,
    startDate: invoiceAccount.dateRange.startDate
  });

  return mappers.invoiceAccount.crmToModel(invoiceAccountEntity);
};

const persistAgentCompany = async context => {
  const { agentCompany } = context.invoiceAccountAddress;
  if (agentCompany && !agentCompany.id) {
    context.invoiceAccountAddress.agentCompany = await companiesService.createCompany(agentCompany);
  }
  return context;
};

const getInvoiceAccountAddressCompany = context => context.invoiceAccountAddress.agentCompany || context.invoiceAccount.company;

const persistAddress = async context => {
  const { address, dateRange: { startDate } } = context.invoiceAccountAddress;

  // Create address in CRM
  if (!address.id) {
    context.invoiceAccountAddress.address = await addressesService.createAddress(address);
  }

  // Add address to company with "billing" role
  const company = getInvoiceAccountAddressCompany(context);
  await companiesService.createCompanyAddress(company.id, context.invoiceAccountAddress.address.id, {
    startDate,
    roleName: CONTACT_ROLES.billing
  });

  return context;
};

const persistContact = async context => {
  const { contact, dateRange: { startDate } } = context.invoiceAccountAddress;

  if (contact) {
    // Create contact in CRM
    if (!contact.id) {
      context.invoiceAccountAddress.contact = await contactsService.createContact(contact);
    }

    // Add contact to company with "billing" role
    const company = getInvoiceAccountAddressCompany(context);
    await companiesService.createCompanyContact(company.id, context.invoiceAccountAddress.contact.id, {
      startDate,
      roleName: CONTACT_ROLES.billing
    });
  }

  return context;
};

const persistInvoiceAccountAddress = async context => {
  const { invoiceAccount, invoiceAccountAddress } = context;
  return invoiceAccountAddressesService.createInvoiceAccountAddress(invoiceAccount, invoiceAccountAddress);
};

const createInvoiceAccountAddress = async (invoiceAccountId, invoiceAccountAddress) => {
  validators.assertId(invoiceAccountId);
  validators.assertIsInstanceOf(invoiceAccountAddress, InvoiceAccountAddress);

  // Load invoice account
  const invoiceAccount = await getByInvoiceAccountId(invoiceAccountId);

  // Create list of tasks needed to create the invoice account address
  const context = { invoiceAccount, invoiceAccountAddress };
  const tasks = [
    persistAgentCompany,
    persistAddress,
    persistContact,
    persistInvoiceAccountAddress
  ];

  try {
    return await promiseWaterfall(tasks, context);
  } catch (err) {
    logger.error('Error creating invoice account address', context);
    throw err;
  }
};

/**
 * Checks whether the entity has data in the model other than the id
 * NB: Existing entities only have the id key populated
 */
const isNewEntity = entity => {
  if (!entity) return false;
  const values = Object.values(entity);
  // remove the id if present
  if (entity.id) values.shift();
  return values.length > 0 && values.some(value => !isEmpty(value));
};

/**
 * Gets the related invoice account for the supplied ChargeVersion model
 * @param {ChargeVersion} chargeVersion
 * @return {chargeVersion} decorated with invoice account
 */
const decorateWithInvoiceAccount = async model => {
  if (!model.invoiceAccount) {
    return model;
  }
  const { id } = model.invoiceAccount;
  const invoiceAccount = await getByInvoiceAccountId(id);
  model.invoiceAccount = invoiceAccount;
  return model;
};

exports.getByInvoiceAccountIds = getByInvoiceAccountIds;
exports.getByInvoiceAccountId = getByInvoiceAccountId;
exports.decorateWithInvoiceAccount = decorateWithInvoiceAccount;
exports.deleteInvoiceAccount = deleteInvoiceAccount;
exports.createInvoiceAccount = createInvoiceAccount;
exports._isNewEntity = isNewEntity;
exports.createInvoiceAccountAddress = createInvoiceAccountAddress;
