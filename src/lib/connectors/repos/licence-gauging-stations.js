'use strict';
const { LicenceGaugingStations } = require('../bookshelf');
const helpers = require('./lib/helpers');

const create = data =>
  helpers.create(LicenceGaugingStations, data);

exports.create = create;
