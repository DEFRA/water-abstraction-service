const { bookshelf } = require('../../../lib/connectors/bookshelf');
const returnRequirementsConnector = require('../../../lib/connectors/repos/return-requirements');

const createReturnRequirement = async (ver, returnsFrequency, formatId) => {
  const requirement = {
    returnsFrequency,
    returnVersionId: ver.returnVersionId,
    isSummer: false,
    isUpload: false,
    abstractionPeriodStartDay: 1,
    abstractionPeriodStartMonth: 1,
    abstractionPeriodEndDay: 31,
    abstractionPeriodEndMonth: 12,
    siteDescription: 'WELL POINTS AT MARS',
    description: '2 Jigga Watts 2000 CMD',
    legacyId: formatId,
    externalId: `6:${formatId}`
  };

  return returnRequirementsConnector.create(requirement);
};

const deleteReturnRequirements = `delete from water.return_requirements rr
using 
    water.licences l,
    water.return_versions rv
  where    
    rr.return_version_id=rv.return_version_id
    and rv.licence_id=l.licence_id 
    and l.is_test=true;`;

const deleteReturnRequirement = async () => bookshelf.knex.raw(deleteReturnRequirements);

exports.create = createReturnRequirement;
exports.delete = deleteReturnRequirement;
