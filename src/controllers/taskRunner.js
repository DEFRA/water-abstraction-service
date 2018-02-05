const DB = require('../lib/connectors/db');
const NotifyClient = require('notifications-node-client').NotifyClient;
const notifyClient = new NotifyClient(process.env.NOTIFY_KEY);
const Joi = require('joi');

async function reset() {
  console.log('resetting scheduler')
    var query = `
      UPDATE "water"."scheduler" SET running=0`
      var reset = await DB.query(query)
    return true

}
async function run() {

  try {

    var query = `
      WITH job AS (
         SELECT *
         FROM "water"."scheduler" job
         WHERE running=0 and next_run <= now()
         LIMIT  1
         FOR    UPDATE
         )
      UPDATE "water"."scheduler" s SET running=1
      from job where job.task_id=s.task_id
      RETURNING * ;`
    var job = await DB.query(query)
    if (job.data.length == 0) {} else {

      try{
        var interval=JSON.parse(job.data[0].task_config)
      }catch(e){
        var interval={count:1,period:'minute'}
      }



      const taskHandler = require(`./tasks/${job.data[0].task_type}`);
      var log = await taskHandler.run(job.data[0])
      console.log('task completed', log)




      try {
        var query = `UPDATE "water"."scheduler" SET running=0, log=$2,last_run=now(),next_run= now() + interval \'${interval.count}\' ${interval.period} where task_id=$1`
        console.log(query)
        var params = [job.data[0].task_id, JSON.stringify(log)];
        try {
          var close = await DB.query(query, params)
        } catch (e) {
          throw e
        }
      } catch (e) {
        console.log(e)
        return e
      }
    }
  } catch (e) {
    console.log(e)
  }
}

module.exports = {
  run,reset
};
