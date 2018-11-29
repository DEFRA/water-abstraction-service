const DB = require('../lib/connectors/db');
const os = require('os');
const logger = require('../lib/logger');

async function reset () {
  logger.debug('resetting scheduler');
  var query = `
      UPDATE "water"."scheduler" SET running=0 where running_on = '${os.hostname()}'`;
  await DB.query(query);
  return true;
}

const getNextJob = async () => {
  const query = `
    WITH job AS (
       SELECT *
       FROM "water"."scheduler" job
       WHERE running=0 and next_run <= now()
       LIMIT  1
       FOR    UPDATE
    )
    UPDATE "water"."scheduler" s
    SET running=1, running_on = '${os.hostname()}'
    from job
    where job.task_id = s.task_id
    RETURNING * ;`;

  const job = await DB.query(query);
  return job;
};

const getJobInterval = job => {
  try {
    const interval = JSON.parse(job.data[0].task_config);
    return interval;
  } catch (e) {
    return { count: 1, period: 'minute' };
  }
};

const updateTaskTimeStarted = async taskId => {
  const query = `UPDATE "water"."scheduler" SET last_run_started=NOW() where task_id=$1`;
  await DB.query(query, [taskId]);
};

const endTask = async (taskId, log, interval) => {
  const query = `
    UPDATE "water"."scheduler"
    SET running=0, running_on=null, log=$2, last_run=now(), next_run= now() + interval '${interval.count}' ${interval.period}
    where task_id=$1`;

  const params = [taskId, JSON.stringify(log)];
  await DB.query(query, params);
};

async function run () {
  try {
    const job = await getNextJob();

    if (job.data.length > 0) {
      const { task_type: taskType, task_id: taskId } = job.data[0];

      // Record the time the task started
      await updateTaskTimeStarted(taskId);

      const taskHandler = require(`./tasks/${taskType}`);
      let log;

      try {
        logger.debug('starting task: ' + taskType);
        log = await taskHandler.run(job.data[0]);
        logger.debug('task completed: ' + taskType);
      } catch (e) {
        log = e.message;
        logger.error('task completed IN ERROR: ' + e);
      }

      try {
        const interval = getJobInterval(job);
        await endTask(taskId, log, interval);
      } catch (e) {
        logger.error(`Failed to end task: ${taskType}`, e);
        return e;
      }
    }
  } catch (e) {
    logger.error('Error running task', e);
  }
}

module.exports = {
  run,
  reset
};
