const moment = require('moment');

/**
 * Calculates the next check time
 * @param {Object} message      the scheduled_notification
 * @param  {String} message.message_type email|letter
 * @param  {String} message.send_after the timestamp when the message was sent
 * @param  {Number} message.status_checks the number of times the message has been checked
 * @return {String}             the timestamp of the next check
 */
const getNextCheckTime = (message) => {
  const {
    message_type: messageType,
    send_after: sent,
    status_checks: checkCount
  } = message;

  const momentSent = moment(sent);

  // For letters, check their status every 12 hours
  if (messageType === 'letter') {
    const hours = 12 * (checkCount + 1);
    momentSent.add(hours, 'hour');
  }
  // For emails, use an exponential check time starting with 1 minute
  if (messageType === 'email') {
    const minutes = Math.pow(1, checkCount + 1);
    momentSent.add(minutes, 'minute');
  }
  return momentSent.format();
};

/**
 * Gets the next value for the status_checks counter
 * @param  {Object} message - the scheduled_notification
 * @param {Number|null} message.status_checks - the number of status checks or null
 * @return {Number} the number of status checks incremented
 */
const getNextCheckCount = (message) => {
  const count = message.status_checks || 0;
  return count + 1;
};

module.exports = {
  getNextCheckTime,
  getNextCheckCount
};
