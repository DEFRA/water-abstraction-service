'use strict';
const { GaugingStation } = require('../bookshelf');
const helpers = require('./lib/helpers');
const queries = require('./queries/gauging-stations');
const raw = require('./lib/raw');

const findOne = id =>
  helpers.findOne(GaugingStation, 'gaugingStationId', id);

const findLicenceConditionsByStationId = gaugingStationId =>
  raw.multiRow(queries.findGaugingStationWithLinkedLicences, { gaugingStationId });

const findOneByStationRef = async stationRef => {
  const model = await GaugingStation
    .forge()
    .where('station_reference', '=', stationRef)
    .fetch({ require: false });

  return model && model.toJSON();
};

const findOneByWiskiId = async wiskiId => {
  const model = await GaugingStation
    .forge()
    .where('wiski_id', '=', wiskiId)
    .fetch({ require: false });

  return model && model.toJSON();
};

const findAllByPartialNameMatch = async query => {
  const results = await GaugingStation
    .forge()
    .where('label', 'ILIKE', `%${query}%`)
    .fetchAll({ require: false });

  return results && results.toJSON();
};

const findAll = () =>
  helpers.findMany(GaugingStation);

const create = data =>
  helpers.create(GaugingStation, data);

const update = (id, changes) => GaugingStation
  .forge('gaugingStationId', id)
  .save(changes, { method: 'update' })
  .toJSON();

const deleteOne = id =>
  helpers.deleteOne(GaugingStation, 'gaugingStationId', id);

exports.findLicenceConditionsByStationId = findLicenceConditionsByStationId;
exports.findOneByStationRef = findOneByStationRef;
exports.findAllByPartialNameMatch = findAllByPartialNameMatch;
exports.findOneByWiskiId = findOneByWiskiId;
exports.findOne = findOne;
exports.findAll = findAll;
exports.create = create;
exports.update = update;
exports.deleteOne = deleteOne;
