
const Nald = require('../../lib/nald')
async function run(data) {
  console.log('run!')
        try{
          await Nald.import()
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
