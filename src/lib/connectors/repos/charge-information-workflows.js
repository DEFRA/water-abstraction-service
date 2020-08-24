'use strict';

const { ChargeVersionWorkflow } = require('../bookshelf');
const helpers = require('./helpers');

const relatedModels = [
  'licence'
];

const findOne = id =>
  helpers.findOne(ChargeVersionWorkflow, 'chargeVersionWorkflowId', id, relatedModels);

const findAll = () =>
  helpers.findMany(ChargeVersionWorkflow, {}, relatedModels);

const create = data =>
  helpers.create(ChargeVersionWorkflow, data);

exports.findOne = findOne;
exports.findAll = findAll;
exports.create = create;
