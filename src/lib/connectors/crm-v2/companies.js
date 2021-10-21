'use strict';

const moment = require('moment');
const urlJoin = require('url-join');
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../../config');

const getUri = (...tail) => urlJoin(config.services.crm_v2, 'companies', ...tail);

/**
 * Get a single company
 * @param {String} companyId The uuid of the company to retrieve
 */
const getCompany = companyId => serviceRequest.get(getUri(companyId));

/**
 * Gets an array of companies that match by name
 * @param {String} name
 * @param {Boolean} soft
 */
const searchCompaniesByName = (name, soft) => serviceRequest.get(getUri('search'), {
  qs: {
    name: name,
    soft: soft
  }
});

/**
 * Creates a company entity in the CRM
 *
 * @param {Object} company The company data to save in the CRM
 */
const createCompany = async company => {
  const uri = getUri();
  return serviceRequest.post(uri, { body: company });
};

const deleteCompany = async companyId => serviceRequest.delete(getUri(companyId));

/**
 * Get addresses for the specififed company
 * @param {String} companyId The uuid of the company to retrieve
 */
const getCompanyAddresses = companyId => serviceRequest.get(getUri(companyId, 'addresses'));

/**
 * Creates a company addresses entity in the CRM
 *
 * @param {String} companyId The company that will have the address added to
 * @param {Object} companyAddress The company address data
 */
const createCompanyAddress = async (companyId, companyAddress) => {
  const uri = getUri(companyId, 'addresses');
  return serviceRequest.post(uri, { body: companyAddress });
};

const deleteCompanyAddress = async (companyId, companyAddressId) =>
  serviceRequest.delete(getUri(companyId, 'addresses', companyAddressId));

/**
 * Creates a company contacts entity in the CRM
 *
 * @param {String} companyId The company that will have the contact added to
 * @param {Object} companyContact The company contact data
 */
const createCompanyContact = async (companyId, companyContact) => {
  const uri = getUri(companyId, 'contacts');
  return serviceRequest.post(uri, { body: companyContact });
};

const deleteCompanyContact = async (companyId, companyContactId) =>
  serviceRequest.delete(getUri(companyId, 'contacts', companyContactId));

/**
 * Get the CompanyContacts for a given company id
 *
 * @param {String} companyId The uuid of the company to retrieve the contacts for
 */
const getCompanyContacts = companyId => {
  return serviceRequest.get(getUri(companyId, 'contacts'));
};

const patchCompanyContact = (companyId, contactId, body) => {
  return serviceRequest.patch(getUri(companyId, 'contacts', contactId), { body });
};

const postCompanyContact = (companyId, body) => serviceRequest.post(getUri(companyId, 'contacts'), {
  body: {
    ...body,
    startDate: moment().format('YYYY-MM-DD'),
    isDefault: false
  }
});

/**
 * Returns the invoice accounts associated with a company by its GUID
 * @param {String} companyId
 */

const getInvoiceAccountsByCompanyId = async companyId => serviceRequest.get(getUri(`${companyId}/invoice-accounts`));

const getCompanyLicences = async companyId => serviceRequest.get(getUri(`${companyId}/licences`));

exports.createCompany = createCompany;
exports.getCompany = getCompany;
exports.deleteCompany = deleteCompany;
exports.getCompanyAddresses = getCompanyAddresses;
exports.createCompanyAddress = createCompanyAddress;
exports.deleteCompanyAddress = deleteCompanyAddress;
exports.createCompanyContact = createCompanyContact;
exports.deleteCompanyContact = deleteCompanyContact;
exports.getCompanyContacts = getCompanyContacts;
exports.patchCompanyContact = patchCompanyContact;
exports.postCompanyContact = postCompanyContact;
exports.getInvoiceAccountsByCompanyId = getInvoiceAccountsByCompanyId;
exports.searchCompaniesByName = searchCompaniesByName;
exports.getCompanyLicences = getCompanyLicences;
