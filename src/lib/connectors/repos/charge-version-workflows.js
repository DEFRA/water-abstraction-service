'use strict';

const { ChargeVersionWorkflow } = require('../bookshelf');
const helpers = require('./lib/helpers');

const relatedModels = [
  'licence',
  'licence.region'
];

const findOne = id =>
  helpers.findOne(ChargeVersionWorkflow, 'chargeVersionWorkflowId', id, relatedModels);

const findAll = () =>
  helpers.findMany(ChargeVersionWorkflow, {}, relatedModels);

const findManyForLicence = licenceId =>
  helpers.findMany(ChargeVersionWorkflow, { licence_id: licenceId }, relatedModels);

const create = data =>
  helpers.create(ChargeVersionWorkflow, data);

const update = (id, changes) =>
  helpers.update(ChargeVersionWorkflow, 'chargeVersionWorkflowId', id, changes);

const deleteOne = id =>
  helpers.deleteOne(ChargeVersionWorkflow, 'chargeVersionWorkflowId', id);

exports.findOne = findOne;
exports.findAll = findAll;
exports.findManyForLicence = findManyForLicence;
exports.create = create;
exports.update = update;
exports.deleteOne = deleteOne;
