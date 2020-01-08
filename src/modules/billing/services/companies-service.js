const Company = require('../../../lib/models/company');

/**
 * Maps a row of CRM v2 contact data to a Company instance
 * @param {Object} companyData
 * @return {Company}
 */
const mapCRMCompanyToModel = companyData => {
  const company = new Company();
  company.id = companyData.companyId;
  company.name = companyData.name;
  return company;
};

exports.mapCRMCompanyToModel = mapCRMCompanyToModel;
