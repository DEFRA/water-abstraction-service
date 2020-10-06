'use strict';

const purposeUseMapper = require('./purpose-use');
const ReturnRequirementPurpose = require('../models/return-requirement-purpose');

/**
 * Maps a row from water.return_requirement_purposes to the ReturnRequirementPurpose service model
 * @param {Object} row
 * @return {ReturnRequirementPurpose} service model
 */
const dbToModel = row => {
  const model = new ReturnRequirementPurpose();

  return model.fromHash({
    id: row.returnRequirementPurposeId,
    purposeUse: purposeUseMapper.dbToModel(row.purposeUse),
    purposeAlias: row.purposeAlias
  });
};

exports.dbToModel = dbToModel;
