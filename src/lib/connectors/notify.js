const NotifyClient = require('notifications-node-client').NotifyClient

const messageTypes = {
  email: 'email',
  letter: 'letter',
  sms: 'sms'
}

/**
 * Gets the Notify API key.
 * @TODO we may need per-message type/environment config of key selection
 * @param  {Object} env  Node environment
 * @param  {String} type Message type email|letter
 * @return {String}      Notify API key
 */
const getKey = (env, type) => {
  // Always use live key in production environment
  if (env.NODE_ENV === 'production') {
    return env.LIVE_NOTIFY_KEY
  }
  // In other environments, use whitelist key for email/SMS, and test key for anything else
  return [messageTypes.email, messageTypes.sms].includes(type)
    ? env.WHITELIST_NOTIFY_KEY
    : env.TEST_NOTIFY_KEY
}

/**
 * Gets a notify client
 * @param {String} [type] - the message type can be email|letter|sms
 * @param {Object} [env] - for unit testing, allows a value to be passed for process.env
 * @return {Object} nofify client
 */
const getClient = (type, env = process.env) => {
  const key = getKey(env, type)
  return new NotifyClient(key)
}

exports._getKey = getKey
exports.getClient = getClient
exports.messageTypes = messageTypes
