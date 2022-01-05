'use strict';
const { truncate } = require('lodash');

const { createMapper } = require('../object-mapper');
const helpers = require('./lib/helpers');

const ChargeCategory = require('../models/charge-category');

const csvToModel = data => {
  const chargeCategory = new ChargeCategory();

  /* eslint-disable */
  const {
    reference,
    subsistence_charge,
    description,
    short_description,
    min_volume,
    max_volume,
    is_tidal,
    loss_factor,
    model_tier,
    is_restricted_source
  } = data;
  /* eslint-enable */
  return chargeCategory.fromHash({
    reference,
    description,
    subsistenceCharge: parseInt(subsistence_charge),
    shortDescription: truncate(short_description, { length: 150 }),
    minVolume: parseInt(min_volume),
    maxVolume: parseInt(max_volume),
    isTidal: is_tidal,
    lossFactor: loss_factor,
    modelTier: model_tier,
    isRestrictedSource: is_restricted_source
  });
};

/* Humanize and copy fields */
const dbToModelMapper = createMapper()
  .map('charge_category_id').to('chargeCategoryId')
  .copy(
    'chargeCategoryId',
    'description',
    'short_description',
    'reference',
    'dateCreated',
    'dateUpdated',
    'minVolume',
    'maxVolume',
    'isTidal',
    'lossFactor',
    'modelTier',
    'isRestrictedSource'
  );

const dbToModel = row => helpers.createModel(ChargeCategory, row, dbToModelMapper);

exports.dbToModel = dbToModel;
exports.csvToModel = csvToModel;
