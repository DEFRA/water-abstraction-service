'use strict';

const LicenceVersionPurposeCondition = require('../models/licence-version-purpose-condition');
const { createMapper } = require('../object-mapper');
const helpers = require('./lib/helpers');

const dbToModelMapper = createMapper()
  .map('licence_version_purpose_condition_id').to('licenceVersionPurposeConditionId')
  .map('param_1').to('param1')
  .map('param_2').to('param2')
  .copy(
    'notes'
  );

const dbToModel = row =>
  helpers.createModel(LicenceVersionPurposeCondition, row, dbToModelMapper);

exports.dbToModel = dbToModel;
