const returnVersionConnector = require('../../../lib/connectors/repos/return-versions');

const createReturnVersion = async (licence, formatId) => {
  const version = {
    licenceId: licence.licenceId,
    versionNumber: 101,
    startDate: '2018-04-01',
    endDate: null,
    status: 'current',
    externalId: `6:${formatId}`
  };

  return returnVersionConnector.create(version);
};

exports.create = createReturnVersion;
