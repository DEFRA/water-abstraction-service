'use strict';

const companiesRepo = require('../connectors/crm-v2/companies');
const companyContactMapper = require('../mappers/company-contact');

const getCompanyContacts = async companyId => {
  const companyContacts = await companiesRepo.getCompanyContacts(companyId);
  return companyContacts.map(companyContactMapper.crmToModel);
};

const getCompanyContactPurpose = async (companyId, contactId) => {
  /* Retrieve relevant contact from CRM api */
  const companyContacts = await companiesRepo.getCompanyContactPurpose(companyId, contactId);
  return companyContacts.map(companyContactMapper.crmToModel);
};

exports.getCompanyContactPurpose = getCompanyContactPurpose;
exports.getCompanyContacts = getCompanyContacts;
