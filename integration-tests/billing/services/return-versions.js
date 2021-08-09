const { bookshelf } = require('../../../src/lib/connectors/bookshelf');

const deleteReturnVersions = `delete from water.return_versions rv
using 
    water.licences l    
  where    
    rv.licence_id=l.licence_id 
    and l.is_test=true;`;

const deleteReturnVersion = async () => bookshelf.knex.raw(deleteReturnVersions);

exports.delete = deleteReturnVersion;
