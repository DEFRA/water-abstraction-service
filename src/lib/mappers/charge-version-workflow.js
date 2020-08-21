'use strict';

const chargeVersionMapper = require('./charge-version');
const userMapper = require('./user');
const ChargeVersionWorkflow = require('../models/charge-version-workflow');
const { pick } = require('lodash');

const dbToModel = row => {
  const model = new ChargeVersionWorkflow();
  return model.fromHash({
    id: row.chargeVersionWorkflowId,
    createdBy: userMapper.dbToModel(row.createdBy),
    approvedBy: userMapper.dbToModel(row.approvedBy),
    ...pick(row, 'approverComments', 'status', 'dateCreated', 'dateUpdated'),
    chargeVersion: chargeVersionMapper.pojoToModel(row.data.chargeVersion)
  });
};

const modelToDb = model => {
  const row = {
    chargeVersionWorkflowId: model.id,
    ...model.pick('approverComments', 'licenceId', 'status'),
    createdBy: model.createdBy.toJSON(),
    data: {
      chargeVersion: model.chargeVersion.toJSON()
    }
  };
  if (model.approvedBy) {
    row.approvedBy = model.approvedBy.toJSON();
  }
  return row;
};

exports.dbToModel = dbToModel;
exports.modelToDb = modelToDb;
