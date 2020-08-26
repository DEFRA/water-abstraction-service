'use strict';

const { ReturnVersion } = require('../bookshelf');

const relatedModels = [
  'returnRequirements',
  'returnRequirements.returnRequirementPurposes',
  'returnRequirements.returnRequirementPurposes.purposeUse'
];

/**
 * Find all return versions for a given licence ID
 * @param {String} licenceId
 * @return {Promise<Array>}
 */
const findByLicenceId = async licenceId => {
  const collection = await ReturnVersion
    .collection()
    .where('licence_id', licenceId)
    .fetch({
      withRelated: relatedModels
    });
  return collection.toJSON();
};

exports.findByLicenceId = findByLicenceId;
