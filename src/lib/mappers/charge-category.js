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
    short_description
  } = data;
  /* eslint-enable */

  return chargeCategory.fromHash({
    reference,
    description,
    subsistenceCharge: subsistence_charge,
    shortDescription: truncate(short_description, { length: 150 })
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
    'dateUpdated'
  );

const dbToModel = row => helpers.createModel(ChargeCategory, row, dbToModelMapper);

exports.dbToModel = dbToModel;
exports.csvToModel = csvToModel;
