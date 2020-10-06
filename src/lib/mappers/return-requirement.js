'use strict';

const ReturnRequirement = require('../models/return-requirement');
const returnRequirementPurposeMapper = require('./return-requirement-purpose');

/**
 * Maps a row from water.return_requirements to the ReturnRequirement service model
 * @param {Object} row
 * @return {ReturnRequirement} service model
 */
const dbToModel = (row) => {
  const model = new ReturnRequirement();

  model.fromHash({
    id: row.returnRequirementId,
    isSummer: row.isSummer,
    externalId: row.externalId
  });

  if (row.returnRequirementPurposes) {
    model.returnRequirementPurposes = row.returnRequirementPurposes.map(returnRequirementPurposeMapper.dbToModel);
  }

  return model;
};

exports.dbToModel = dbToModel;
