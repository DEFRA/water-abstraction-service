const childProcess = require('child_process');
const { promisify } = require('util');

/**
 * Executes (and logs) a shell command, returning a promise
 * @param {String} shell command
 * @return {Promise}
 */
const execCommand = (cmd) => {
  return promisify(childProcess.exec)(cmd);
};

module.exports = {
  execCommand
};
