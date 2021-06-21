'use strict';

const LicenceVersionPurposeCondition = require('../models/licence-version-purpose-condition');
const { createMapper } = require('../object-mapper');
const helpers = require('./lib/helpers');

const dbToModelMapper = createMapper()
  .copy(
    'licenceVersionPurposeConditionId',
    'param1',
    'param2',
    'notes'
  );

const dbToModel = row =>
  helpers.createModel(LicenceVersionPurposeCondition, row, dbToModelMapper);

exports.dbToModel = dbToModel;
