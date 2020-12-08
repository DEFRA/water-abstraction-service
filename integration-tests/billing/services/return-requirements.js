const { ReturnVersion, ReturnRequirement, ReturnRequirementPurpose, bookshelf } = require('../../../src/lib/connectors/bookshelf');
const returnReqsData = require('./data/return-requirements');
const purposePrimaryService = require('./purpose-primary');
const purposeSecondaryService = require('./purpose-secondary');
const purposeUsesService = require('./purpose-uses');
const queries = require('./queries/return-requirements');

/**
 * Create the test licence in the region with the specified
 * @param {Object} region
 * @param {String} scenarioKey
 */
const createReturnVersion = async (data) => {
  const returnsVersion = await ReturnVersion
    .forge(data)
    .save();
  return returnsVersion;
};

/**
 * Create the test licence in the region with the specified
 * @param {Object} region
 * @param {String} scenarioKey
 */
const createReturnRequirement = async (data) => {
  const returnsVersion = await ReturnRequirement
    .forge(data)
    .save();
  return returnsVersion;
};

/**
 * Create the test licence in the region with the specified
 * @param {Object} region
 * @param {String} scenarioKey
 */
const createReturnRequirementPurpose = async (data) => {
  const returnRequirementPurpose = await ReturnRequirementPurpose
    .forge(data)
    .save();
  return returnRequirementPurpose;
};

const tearDown = async () => {
  await bookshelf.knex.raw(queries.deleteReturnRequirementPurposes);
  await bookshelf.knex.raw(queries.deleteReturnRequirements);
  await bookshelf.knex.raw(queries.deleteReturnVersions);
};

const createReturnRequirementsData = async (returnsRequirements, licenceId) => {
  for (const row of returnsRequirements) {
    const { version, requirement, purpose } = returnReqsData[row.returnRequirement];

    // create return requirement version
    const ver = await createReturnVersion({ ...version, licenceId });

    // create return requirement
    const req = await createReturnRequirement({ ...requirement, returnVersionId: ver.get('returnVersionId') });

    // create return requirement purpose
    const [primary, secondary, use] = await Promise.all([
      purposePrimaryService.createAndGetId(purpose.purposePrimaryId),
      purposeSecondaryService.createAndGetId(purpose.purposeSecondaryId),
      purposeUsesService.createAndGetId(purpose.purposeUseId)
    ]);

    purpose.purposePrimaryId = primary.get('purposePrimaryId');
    purpose.purposeSecondaryId = secondary.get('purposeSecondaryId');
    purpose.purposeUseId = use.get('purposeUseId');
    purpose.returnRequirementId = req.get('returnRequirementId');
    await createReturnRequirementPurpose(purpose);
  };
};

exports.create = createReturnRequirementsData;
exports.tearDown = tearDown;
