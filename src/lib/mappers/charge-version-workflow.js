'use strict';

const chargeVersionMapper = require('./charge-version');
const userMapper = require('./user');
const licenceMapper = require('./licence');
const ChargeVersionWorkflow = require('../models/charge-version-workflow');
const { pick } = require('lodash');

/**
 * Converts DB representation to a ChargeVersionWorkflow service model
 * @param {Object} row
 * @return {ChargeVersionWorkflow}
 */
const dbToModel = row => {
  const model = new ChargeVersionWorkflow();
  model.fromHash({
    id: row.chargeVersionWorkflowId,
    createdBy: userMapper.dbToModel(row.createdBy),
    approvedBy: userMapper.dbToModel(row.approvedBy),
    ...pick(row, 'approverComments', 'status', 'dateCreated', 'dateUpdated'),
    chargeVersion: chargeVersionMapper.pojoToModel(row.data.chargeVersion)
  });

  if (row.licence) {
    const licence = licenceMapper.dbToModel(row.licence);
    model.licence = licence;
    model.chargeVersion.licence = licence;
    model.chargeVersion.region = licence.region;
  }

  return model;
};

/**
 * Converts ChargeVersionWorkflow service model to a DB row
 * @param {ChargeVersionWorkflow} model
 * @return {Object}
 */
const modelToDb = model => {
  const row = {
    chargeVersionWorkflowId: model.id,
    licenceId: model.licence.id,
    ...model.pick('approverComments', 'status'),
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
