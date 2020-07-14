const companiesConnector = require('../connectors/crm-v2/companies');
const mappers = require('../mappers');
const { NotFoundError } = require('../errors');

const getCompany = async companyId => {
  const company = await companiesConnector.getCompany(companyId);
  if (company) return mappers.company.crmToModel(company);
  throw new NotFoundError(`Company ${companyId} not found`);
};

const getCompanyAddresses = async companyId => {
  const companyAddresses = await companiesConnector.getCompanyAddresses(companyId);
  return companyAddresses.map(mappers.companyAddress.crmToModel);
};

const createCompany = async companyData => {
  const company = await companiesConnector.createCompany(mappers.company.serviceToCrm(companyData));
  return mappers.company.crmToModel(company);
};

const createCompanyAddress = async (companyId, companyAddressData) => {
  const companyAddress = await companiesConnector.createCompanyAddress(companyId, companyAddressData);
  return mappers.companyAddress.crmToModel(companyAddress);
};

const createCompanyContact = async (companyId, companyContactData) => {
  const companyContact = await companiesConnector.createCompanyContact(companyId, companyContactData);
  return mappers.companyContact.crmToModel(companyContact);
};

exports.getCompany = getCompany;
exports.getCompanyAddresses = getCompanyAddresses;
exports.createCompany = createCompany;
exports.createCompanyAddress = createCompanyAddress;
exports.createCompanyContact = createCompanyContact;
