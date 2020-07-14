'use strict';

const { isEmpty } = require('lodash');
const Company = require('../models/company');

/**
 * Maps a row of CRM v2 contact data to a Company instance
 * @param {Object} companyData
 * @return {Company}
 */
const crmToModel = companyData => {
  if (isEmpty(companyData)) {
    return null;
  }
  const company = new Company(companyData.companyId);
  return company.pickFrom(companyData, ['name', 'type', 'organisationType']);
};

const serviceToCrm = companyData => ({
  ...companyData,
  type: companyData.type === 'individual' ? 'person' : 'organisation',
  organisationType: companyData.type
});

exports.crmToModel = crmToModel;
exports.serviceToCrm = serviceToCrm;
