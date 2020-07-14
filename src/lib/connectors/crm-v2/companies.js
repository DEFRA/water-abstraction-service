'use strict';

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
 * Creates a company entity in the CRM
 *
 * @param {Object} company The company data to save in the CRM
 */
const createCompany = async company => {
  const uri = getUri();
  return serviceRequest.post(uri, { body: company });
};

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

/**
 * Get the CompanyContacts for a given company id
 *
 * @param {String} companyId The uuid of the company to retrieve the contacts for
 */
const getCompanyContacts = companyId => {
  return serviceRequest.get(getUri(companyId, 'contacts'));
};

exports.createCompany = createCompany;
exports.getCompanyAddresses = getCompanyAddresses;
exports.createCompanyAddress = createCompanyAddress;
exports.createCompanyContact = createCompanyContact;
exports.getCompany = getCompany;
exports.getCompanyContacts = getCompanyContacts;
