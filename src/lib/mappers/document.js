'use strict';

const DateRange = require('../models/date-range');
const Document = require('../models/document');
const roleMapper = require('./role');

const crmToModel = data => {
  const model = new Document();

  model
    .fromHash({
      id: data.documentId,
      dateRange: new DateRange(data.startDate, data.endDate)
    })
    .pickFrom(data, 'status', 'roleName');

  if (data.documentRoles) {
    model.roles = data.documentRoles.map(roleMapper.crmToModel);
  }

  return model;
};

exports.crmToModel = crmToModel;
