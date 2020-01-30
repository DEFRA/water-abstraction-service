'use strict';

const { pool } = require('../lib/connectors/db');
const os = require('os');
const { logger } = require('../logger');

const reset = () => {
  logger.debug('resetting scheduler');
  const query = `
    UPDATE "water"."scheduler"
    SET running=0
    WHERE running_on = '${os.hostname()}';
  `;
  return pool.query(query);
};

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
    RETURNING *;`;

  const { rows: [job] } = await pool.query(query);
  return job;
};

const getJobInterval = job => {
  try {
    const interval = JSON.parse(job.task_config);
    return interval;
  } catch (e) {
    return { count: 1, period: 'day' };
  }
};

const updateTaskTimeStarted = taskId => {
  const query = `
    UPDATE "water"."scheduler"
    SET
      last_run_started = NOW(),
      date_updated = NOW(),
      running_on = '${os.hostname()}'
    where task_id=$1;
  `;
  return pool.query(query, [taskId]);
};

const endTask = (taskId, log, interval) => {
  const query = `
    UPDATE "water"."scheduler"
    SET running=0, running_on=null, log=$2, last_run=now(), next_run= now() + interval '${interval.count}' ${interval.period}
    where task_id=$1;
  `;

  const params = [taskId, JSON.stringify(log)];
  return pool.query(query, params);
};

async function run () {
  // We don't wish to run the scheduler in Travis because it will cause
  // jobs to run which may invoke Slack etc.
  if (process.env.TRAVIS) {
    return;
  }

  try {
    const job = await getNextJob();

    if (job) {
      const { task_type: taskType, task_id: taskId } = job;

      // Record the time the task started
      await updateTaskTimeStarted(taskId);

      const taskHandler = require(`./tasks/${taskType}`);
      let log;

      try {
        logger.debug('starting task: ' + taskType);
        log = await taskHandler.run(job);
        logger.debug('task completed: ' + taskType);
      } catch (e) {
        logger.error('task completed IN ERROR', e, { job });
      }

      try {
        const interval = getJobInterval(job);
        await endTask(taskId, log, interval);
      } catch (e) {
        logger.error('Failed to end task', e, { job, taskType });
        return e;
      }
    }
  } catch (e) {
    logger.error('Error running task', e);
  }
}

exports.run = run;
exports.reset = reset;
