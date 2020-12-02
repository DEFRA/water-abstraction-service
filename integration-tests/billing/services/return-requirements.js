const { ReturnVersion, ReturnRequirement, ReturnRequirementPurpose, bookshelf } = require('../../../src/lib/connectors/bookshelf');
const returnsData = require('./data/returns');
const purposePrimaryServ = require('./purpose-primary');
const purposeSecondaryServ = require('./purpose-secondary');
const purposeUsesServ = require('./purpose-uses');
const queries = require('./queries/return-requirements');

/**
 * Create the test licence in the region with the specified
 * @param {Object} region
 * @param {String} scenarioKey
 */
const createReturnVersion = async (licenceId) => {
  const returnsVersion = await ReturnVersion
    .forge({
      licenceId: licenceId,
      ...returnsData.r2
    })
    .save();

  return returnsVersion;
};

/**
 * Create the test licence in the region with the specified
 * @param {Object} region
 * @param {String} scenarioKey
 */
const createReturnRequirement = async (returnVersionId) => {
  const returnsVersion = await ReturnRequirement
    .forge({
      returnVersionId,
      ...returnsData.r3
    })
    .save();

  return returnsVersion;
};

/**
 * Create the test licence in the region with the specified
 * @param {Object} region
 * @param {String} scenarioKey
 */
const createReturnRequirementPurpose = async (returnRequirementId) => {
  const purposePrimary = await purposePrimaryServ.getByLegacyId('A');
  const purposeSecondary = await purposeSecondaryServ.getByLegacyId('AGR');
  const purposeUse = await purposeUsesServ.getByLegacyId('400');

  const dataa = returnsData.r4;
  dataa.purposePrimaryId = purposePrimary.get('purposePrimaryId');
  dataa.purposeSecondaryId = purposeSecondary.get('purposeSecondaryId');
  dataa.purposeUseId = purposeUse.get('purposeUseId');

  const returnRequirementPurpose = await ReturnRequirementPurpose
    .forge({
      returnRequirementId,
      ...dataa
    })
    .save();

  return returnRequirementPurpose;
};

const tearDown = async () => {
  await bookshelf.knex.raw(queries.deleteReturnRequirementPurposes);
  await bookshelf.knex.raw(queries.deleteReturnRequirements);
  await bookshelf.knex.raw(queries.deleteReturnVersions);
};

const createReturnRequirementsData = async licenceId => {
  const version = await createReturnVersion(licenceId);
  const requirement = await createReturnRequirement(version.get('returnVersionId'));
  const purpose = await createReturnRequirementPurpose(requirement.get('returnRequirementId'));
  return { version, requirement, purpose };
};

exports.create = createReturnRequirementsData;
exports.tearDown = tearDown;
