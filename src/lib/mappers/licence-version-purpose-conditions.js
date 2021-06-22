'use strict';

const LicenceVersionPurposeCondition = require('../models/licence-version-purpose-condition');
const { createMapper } = require('../object-mapper');
const helpers = require('./lib/helpers');

const dbToModelMapper = createMapper()
  .map('licenceVersionPurposeConditionId').to('id')
  .copy(
    'param1',
    'param2',
    'notes'
  );

const dbToModel = row => helpers.createModel(LicenceVersionPurposeCondition, row, dbToModelMapper);

exports.dbToModel = dbToModel;
