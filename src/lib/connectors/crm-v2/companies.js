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

exports.getCompany = getCompany;
exports.createCompany = createCompany;
exports.createCompanyAddress = createCompanyAddress;
exports.createCompanyContact = createCompanyContact;
