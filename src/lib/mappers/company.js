'use strict';

const { omit } = require('lodash');
const Company = require('../models/company');
const { ORGANISATION_TYPES, COMPANY_TYPES } = Company;

const { createMapper } = require('../object-mapper');
const { createModel } = require('./lib/helpers');

/**
 * Maps a row of CRM v2 contact data to a Company instance
 * @param {Object} companyData
 * @return {Company}
 */
const crmToModelMapper = createMapper()
  .copy(
    'name',
    'type',
    'organisationType'
  )
  .map('companyId').to('id');

const crmToModel = row => createModel(Company, row, crmToModelMapper, true);

/**
 * Maps only an id or new company data from the UI
 * @param {Object} companyData from UI
 * @return {Company}
 */
const uiToModel = companyData => {
  if (!companyData) return null;
  if (companyData.companyId) {
    return new Company(companyData.companyId);
  }
  const company = new Company();
  return company.fromHash({
    ...companyData,
    type: companyData.type === ORGANISATION_TYPES.individual ? COMPANY_TYPES.person : COMPANY_TYPES.organisation,
    organisationType: companyData.type
  });
};

/**
 * Maps data from company service model to expected crm shape
 * @param {Company} company service model
 * @return {Object}
 */
const modelToCrm = company => omit(company.toJSON(), 'companyAddresses', 'companyContacts');

const pojoToModel = object => {
  const company = new Company();
  return company.pickFrom(object, ['id', 'type', 'organisationType', 'name', 'companyNumber']);
};

exports.crmToModel = crmToModel;
exports.uiToModel = uiToModel;
exports.modelToCrm = modelToCrm;
exports.pojoToModel = pojoToModel;
