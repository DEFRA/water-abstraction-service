/**
 * Loads task config data from database
 * @module modules/notifications/task-config-loader
 */
const { repository: taskConfigRepo } = require('../../../controllers/task-config')
const { findOne } = require('../../../lib/repository-helpers')

module.exports = (taskConfigId) => findOne(taskConfigRepo, taskConfigId)
