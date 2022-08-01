const moment = require('moment')

/**
 * Calculates the next check time
 * @param {Object} message      the scheduled_notification
 * @param  {String} message.message_type email|letter
 * @param  {String} message.send_after the timestamp when the message was sent
 * @param  {Number} message.status_checks the number of times the message has been checked
 * @param  {Object} The moment representation of now (used in testing)
 * @return {String}             the timestamp of the next check
 */
const getNextCheckTime = (message, now = moment()) => {
  const {
    message_type: messageType,
    send_after: sent,
    status_checks: checkCount
  } = message

  const momentSent = moment(sent || now)

  // For letters, check their status every 12 hours
  if (messageType === 'letter') {
    const hours = 12 * (checkCount + 1)
    momentSent.add(hours, 'hour')
  }
  // For emails, use an exponential check time starting with 1 minute
  if (messageType === 'email') {
    const minutes = Math.pow(checkCount + 1, 2)
    momentSent.add(minutes, 'minute')
  }
  return momentSent.format()
}

/**
 * Gets the next value for the status_checks counter
 * @param  {Object} message - the scheduled_notification
 * @param {Number|null} message.status_checks - the number of status checks or null
 * @return {Number} the number of status checks incremented
 */
const getNextCheckCount = (message) => {
  const count = message.status_checks || 0
  return count + 1
}

module.exports = {
  getNextCheckTime,
  getNextCheckCount
}
