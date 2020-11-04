'use strict';

const { ReturnRequirement } = require('../bookshelf');
const helpers = require('./lib/helpers');

const relatedModels = [
  'returnRequirementPurposes',
  'returnRequirementPurposes.purposeUse'
];

const findOneByExternalId = externalId =>
  helpers.findOne(ReturnRequirement, 'externalId', externalId, relatedModels);

exports.findOneByExternalId = findOneByExternalId;
