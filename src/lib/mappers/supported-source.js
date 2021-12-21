'use strict';
const { truncate } = require('lodash');

const { createMapper } = require('../object-mapper');
const helpers = require('./lib/helpers');

const SupportedSource = require('../models/supported-source');

const csvToModel = data => {
  const supportedSource = new SupportedSource();

  /* eslint-disable */
  const {
    reference,
    name,
    line,
    region
  } = data;
  /* eslint-enable */
  return supportedSource.fromHash({
    reference,
    line,
    name: truncate(name, { length: 255 }),
    region: truncate(region, { length: 255 })
  });
};

/* Humanize and copy fields */
const dbToModelMapper = createMapper()
  .map('supported_source_id').to('supportedSourceId')
  .copy(
    'supportedSourceId',
    'name',
    'reference',
    'line',
    'region',
    'dateCreated',
    'dateUpdated'
  );

const dbToModel = row => helpers.createModel(SupportedSource, row, dbToModelMapper);

exports.dbToModel = dbToModel;
exports.csvToModel = csvToModel;
