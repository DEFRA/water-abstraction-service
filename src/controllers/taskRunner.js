const DB = require('../lib/connectors/db');
const os = require('os');

async function reset () {
  console.log('resetting scheduler');
  var query = `
      UPDATE "water"."scheduler" SET running=0 where running_on = '${os.hostname()}'`;
  await DB.query(query);
  return true;
}
async function run () {
  try {
    var query = `
      WITH job AS (
         SELECT *
         FROM "water"."scheduler" job
         WHERE running=0 and next_run <= now()
         LIMIT  1
         FOR    UPDATE
         )
      UPDATE "water"."scheduler" s SET running=1, running_on = '${os.hostname()}'
      from job where job.task_id=s.task_id
      RETURNING * ;`;
    var job = await DB.query(query);
    if (job.data.length === 0) {} else {
      let interval;
      try {
        interval = JSON.parse(job.data[0].task_config);
      } catch (e) {
        interval = {count: 1, period: 'minute'};
      }

      const taskHandler = require(`./tasks/${job.data[0].task_type}`);
      try {
        var log = await taskHandler.run(job.data[0]);
        console.log('task completed: ' + job.data[0].task_type);
      } catch (e) {
        log = e.message;
        console.log('task completed IN ERROR: ' + job.data[0].task_type);
      }

      try {
        query = `UPDATE "water"."scheduler" SET running=0, running_on=null, log=$2,last_run=now(),next_run= now() + interval '${interval.count}' ${interval.period} where task_id=$1`;
        var params = [job.data[0].task_id, JSON.stringify(log)];
        try {
          await DB.query(query, params);
        } catch (e) {
          console.log(e);
          throw e;
        }
      } catch (e) {
        console.log(e);
        return e;
      }
    }
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  run, reset
};
