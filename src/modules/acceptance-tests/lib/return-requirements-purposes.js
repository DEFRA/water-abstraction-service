const { returnRequirementPurposes } = require('../../../lib/connectors/repos');
const { bookshelf } = require('../../../lib/connectors/bookshelf');

const deleteReturnRequirementPurposes = `delete from water.return_requirement_purposes rp
using 
    water.licences l,
    water.return_requirements rr,
    water.return_versions rv
  where
    rp.return_requirement_id=rr.return_requirement_id
    and rr.return_version_id=rv.return_version_id
    and rv.licence_id=l.licence_id 
    and l.is_test=true;`;

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

  const returnReqPurpose = await returnRequirementPurposes.create(purpose);
  return returnReqPurpose;
};

const deleteReturnPurpose = async () => {
  return bookshelf.knex.raw(deleteReturnRequirementPurposes);
};

exports.create = createReturnRequirementPurpose;
exports.delete = deleteReturnPurpose;
