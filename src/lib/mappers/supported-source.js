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
    listOrder,
    regionTag
  } = data;
  /* eslint-enable */
  return supportedSource.fromHash({
    reference,
    name: truncate(name, { length: 255 }),
    listOrder,
    regionTag: truncate(regionTag, { length: 255 })
  });
};

/* Humanize and copy fields */
const dbToModelMapper = createMapper()
  .map('supported_source_id').to('supportedSourceId')
  .copy(
    'supportedSourceId',
    'name',
    'reference',
    'listOrder',
    'regionTag',
    'dateCreated',
    'dateUpdated'
  );

const dbToModel = row => helpers.createModel(SupportedSource, row, dbToModelMapper);

exports.dbToModel = dbToModel;
exports.csvToModel = csvToModel;
