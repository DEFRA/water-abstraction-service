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

const createReturnRequirementsData = async (returnsData, licenceId) => {
  const tempBody = { ...returnReqsData };
  const { version, requirement, purpose } = tempBody[returnsData.returnRequirement];

  // create return requirement version
  const ver = await createReturnVersion({ ...version, licenceId });

  // create return requirement
  const req = await createReturnRequirement({ ...requirement, returnVersionId: ver.get('returnVersionId') });

  // create return requirement purpose
  const primary = await purposePrimaryService.createAndGetId(purpose.purposePrimaryId);
  const secondary = await purposeSecondaryService.createAndGetId(purpose.purposeSecondaryId);
  const use = await purposeUsesService.createAndGetId(purpose.purposeUseId);

  purpose.purposePrimaryId = primary.get('purposePrimaryId');
  purpose.purposeSecondaryId = secondary.get('purposeSecondaryId');
  purpose.purposeUseId = use.get('purposeUseId');
  purpose.returnRequirementId = req.get('returnRequirementId');

  const returnReqPurpose = await createReturnRequirementPurpose(purpose);
  return { returnReqPurpose, purpose };
};

const tearDownReturnPurposes = async () => {
  return bookshelf.knex.raw(queries.deleteReturnRequirementPurposes);
};
const tearDownReturnRequirements = async () => {
  return bookshelf.knex.raw(queries.deleteReturnRequirements);
};
const tearDownReturnVersions = async () => {
  return bookshelf.knex.raw(queries.deleteReturnVersions);
};

exports.create = createReturnRequirementsData;
exports.tearDownReturnPurposes = tearDownReturnPurposes;
exports.tearDownReturnRequirements = tearDownReturnRequirements;
exports.tearDownReturnVersions = tearDownReturnVersions;
