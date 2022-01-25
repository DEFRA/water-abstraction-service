'use strict';
const { truncate } = require('lodash');
const camelCaseKeys = require('../camel-case-keys');

const { createMapper } = require('../object-mapper');
const helpers = require('./lib/helpers');

const SupportedSource = require('../models/supported-source');

const csvToModel = data => {
  const supportedSource = new SupportedSource();

  /* eslint-disable */
  const {
    reference,
    order,
    name,
    region
  } = data;
  /* eslint-enable */
  return supportedSource.fromHash({
    reference,
    order,
    name: truncate(name, { length: 255 }),
    region: truncate(region, { length: 255 })
  });
};

/* Humanize and copy fields */
const dbToModelMapper = createMapper()
  .map('billingSupportedSourceId').to('supportedSourceId')
  .map('billingSupportedSourceId').to('id')
  .copy(
    'supportedSourceId',
    'name',
    'reference',
    'order',
    'region',
    'dateCreated',
    'dateUpdated'
  );

const dbToModel = row => helpers.createModel(SupportedSource, camelCaseKeys(row), dbToModelMapper);

exports.dbToModel = dbToModel;
exports.csvToModel = csvToModel;
