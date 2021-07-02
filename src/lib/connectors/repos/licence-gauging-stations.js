'use strict';
const { LicenceGaugingStations } = require('../bookshelf');
const helpers = require('./lib/helpers');

const findOneById = licenceGaugingStationId =>
  helpers.findOne(LicenceGaugingStations, 'licenceGaugingStationId', licenceGaugingStationId);

const create = data =>
  helpers.create(LicenceGaugingStations, data);

const deleteOne = licenceGaugingStationId =>
  helpers.update(LicenceGaugingStations, 'licenceGaugingStationId', licenceGaugingStationId, { date_deleted: new Date() });

exports.findOneById = findOneById;
exports.create = create;
exports.deleteOne = deleteOne;
