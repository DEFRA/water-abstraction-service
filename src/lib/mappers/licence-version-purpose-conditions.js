'use strict';

const LicenceVersionPurposeCondition = require('../models/licence-version-purpose-condition');
const { createMapper } = require('../object-mapper');
const helpers = require('./lib/helpers');

const dbToModelMapper = createMapper()
  .map('licenceVersionPurposeCondition').to('id')
  .copy(
    'param1',
    'param2',
    'notes',
    'dateCreated',
    'dateUpdated'
  );

/**
 * Maps row from water.financial_agreement_types to Agreement service model
 * @param {Object} - row from water.financial_agreement_types
 * @return {Agreement}
 */
const dbToModel = row =>
  helpers.createModel(LicenceVersionPurposeCondition, row, dbToModelMapper);

exports.dbToModel = dbToModel;
