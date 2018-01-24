const DB = require('../lib/connectors/db');
const NotifyClient = require('notifications-node-client').NotifyClient;
const notifyClient = new NotifyClient(process.env.NOTIFY_KEY);
const Joi = require('joi');

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

      const taskHandler = require(`./tasks/${job.data[0].task_type}`);
      var log = await taskHandler.run(job.data[0])
      try {
        var query = 'UPDATE "water"."scheduler" SET running=0, log=$2,last_run=now(),next_run= now() + interval \'1\' day where task_id=$1'
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
  run
};
