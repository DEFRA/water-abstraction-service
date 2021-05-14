'use strict';
const { GaugingStation } = require('../bookshelf');
const helpers = require('./lib/helpers');

const findOne = id =>
  helpers.findOne(GaugingStation, 'gaugingStationId', id);

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

exports.findOne = findOne;
exports.findAll = findAll;
exports.create = create;
exports.update = update;
exports.deleteOne = deleteOne;
