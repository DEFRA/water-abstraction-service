const { bookshelf } = require('../../../lib/connectors/bookshelf');
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

const deleteReturnVersions = `delete from water.return_versions rv
using 
    water.licences l    
  where    
    rv.licence_id=l.licence_id 
    and l.is_test=true;`;

const deleteReturnVersion = async () => bookshelf.knex.raw(deleteReturnVersions);

exports.create = createReturnVersion;
exports.delete = deleteReturnVersion;
