'use strict';

const companyMapper = require('./company');
const DateRange = require('../models/date-range');

const Role = require('../models/role');

/**
 * Maps CRM data for a document role to service model equivalent
 * @param {Object} data
 * @return {DocumentRole}
 */
const crmToModel = data => {
  const model = new Role();
  model.fromHash({
    id: data.documentRoleId,
    roleName: data.roleName,
    dateRange: new DateRange(data.startDate, data.endDate)
  });

  if (data.company) {
    model.company = companyMapper.crmToModel(data.company);
  }

  return model;
};

exports.crmToModel = crmToModel;
