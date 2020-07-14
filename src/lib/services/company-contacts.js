'use strict';

const companiesRepo = require('../connectors/crm-v2/companies');
const companyContactMapper = require('../mappers/company-contact');

const getCompanyContacts = async companyId => {
  const companyContacts = await companiesRepo.getCompanyContacts(companyId);
  return companyContacts.map(companyContactMapper.crmToModel);
};

exports.getCompanyContacts = getCompanyContacts;
