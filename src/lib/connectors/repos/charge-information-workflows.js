'use strict';

const { ChargeVersionWorkflow } = require('../bookshelf');
const helpers = require('./helpers');

const findOne = id =>
  helpers.findOne(ChargeVersionWorkflow, 'charge_version_worklow_id', id);

const findAll = () =>
  helpers.findMany(ChargeVersionWorkflow);

const create = data =>
  helpers.create(ChargeVersionWorkflow, data);

exports.findOne = findOne;
exports.findAll = findAll;
exports.create = create;
