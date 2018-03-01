
const DB = require('../../lib/connectors/db')
async function run(data) {
  console.log('run!')
        try{
          var query = `update water.pending_import set status=0 where status=1;`
          var resetImportStatus = await DB.query(query);
          return {
            error: null
          }
        }catch(e){
          return {
            error: e.message
          }
        }
      }
module.exports = {
  run
}
