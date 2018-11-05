const childProcess = require('child_process');
const { promisify } = require('util');
const logger = require('./logger');

/**
 * Executes (and logs) a shell command, returning a promise
 * @param {String} shell command
 * @return {Promise}
 */
const execCommand = (cmd) => {
  logger.info(cmd);
  return promisify(childProcess.exec)(cmd);
};

module.exports = {
  execCommand
};
