'use strict';

const Company = require('../../../lib/models/company');

/**
 * Maps a row of CRM v2 contact data to a Company instance
 * @param {Object} companyData
 * @return {Company}
 */
const crmToModel = companyData => {
  const company = new Company(companyData.companyId);
  return company.pickFrom(companyData, ['name', 'type']);
};

exports.crmToModel = crmToModel;
