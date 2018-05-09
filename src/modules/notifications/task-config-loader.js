/**
 * Loads task config data from database
 * @module modules/notifications/task-config-loader
 */
const { repository: taskConfigRepo } = require('../../controllers/task-config');

class TaskNotFoundError extends Error {
  constructor (message) {
    super(message);
    this.name = 'TaskNotFoundError';
  }
}

/**
 * @param {Number} taskConfigId - ID of task config in water service database
 * @return {Promise} resolves with object of task config data (if found)
 */
async function loadTaskConfig (taskConfigId) {
  // Load task config data
  const { error, rows: [taskConfig] } = await taskConfigRepo.find({ task_config_id: taskConfigId });

  if (error) {
    throw error;
  }
  if (!taskConfig) {
    throw new TaskNotFoundError(`Task ${taskConfigId} not found`);
  }

  return taskConfig;
}

module.exports = loadTaskConfig;
