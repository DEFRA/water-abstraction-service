const licencesConnector = require('../../../lib/connectors/repos/licences');
const regionsConnector = require('../../../lib/connectors/repos/regions');

const createLicence = async (companyId, licenceId, licenceRef) => {
  const regions = await regionsConnector.find();
  return licencesConnector.create(
    licenceRef,
    regions.find(x => x.naldRegionId === 6).regionId,
    new Date().toJSON().slice(0, 10),
    null, {
      historicalAreaCode: 'SAAR',
      regionalChargeArea: 'Southern'
    },
    true,
    true);
};

exports.create = createLicence;
