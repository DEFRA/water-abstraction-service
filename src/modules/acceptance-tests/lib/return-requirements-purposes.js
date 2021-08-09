const { returnRequirementPurposes } = require('../../../lib/connectors/repos');

/**
 * Create the test licence in the region with the specified
 * @param {Object} region
 * @param {String} scenarioKey
 */
const createReturnRequirementPurpose = async (returnRequirementId, formatId, purposes) => {
  const purpose = {
    purposeAlias: 'SPRAY IRRIGATION STORAGE',
    externalId: `6:${formatId}:A:AGR:420`,
    purposePrimaryId: purposes.primaryPurpose.purposePrimaryId,
    purposeSecondaryId: purposes.secondaryPurpose.purposeSecondaryId,
    purposeUseId: purposes.purposeUse.purposeUseId,
    returnRequirementId
  };

  return returnRequirementPurposes.create(purpose);
};

exports.create = createReturnRequirementPurpose;
