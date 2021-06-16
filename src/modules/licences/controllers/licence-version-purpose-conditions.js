'use strict';

const Boom = require('@hapi/boom');
const licenceVersionPurposeConditionsService = require('../../../lib/services/licence-version-purpose-conditions');

const getLicenceVersionPurposeConditionById = async request => {
  const { licenceVersionPurposeConditionId } = request.params;

  const result = await licenceVersionPurposeConditionsService.getLicenceVersionConditionById(licenceVersionPurposeConditionId);
  return result || Boom.notFound(`Licence version purpose condition ${licenceVersionPurposeConditionId} not found`);
};

exports.getLicenceVersionPurposeConditionById = getLicenceVersionPurposeConditionById;
