const moment = require('moment');
const { repository: eventLogRepo } = require('../../../controllers/events');
const { createGUID } = require('../../../lib/helpers');

/**
 * Make a random string of given length, from pre-defined list of chars
 * to avoid confusion - e.g don't include O and 0
 * @see {@link https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript}
 * @param {Number} length - the length of the random string
 * @return {String}
 */
function randomString (length) {
  let text = '';
  let possible = 'ABCDEFGHJKLMNPQRTUVWXYZ0123456789';
  for (let i = 0; i < length; i++) { text += possible.charAt(Math.floor(Math.random() * possible.length)); }
  return text;
}

/**
 * Get next reference number with a pre-defined prefix
 * @param {String} prefix - the prefix for the reference, e.g. EXPIRY-
 * @return {String} the next prefix
 */
function generateReference (prefix) {
  if (!prefix) {
    return null;
  }
  return prefix + randomString(6);
}

/**
 * Log event
 * @param {Object} taskConfig - the config data from water.task_config table
 * @param {String} issuer - the email address of person issuing notification
 * @param {Array} licences - array of licence numbers impacted by event
 * @param {Array} entities - array of CRM entity IDs impaced by event
 * @param {Object} metadata - supplementary event data
 * @param {String} status - could be 'sent', 'error' etc.
 */
function logEvent (taskConfig, issuer, licences, entities, metadata, status) {
  const data = {
    event_id: createGUID(),
    reference_code: generateReference(taskConfig.config.prefix),
    type: taskConfig.type,
    subtype: taskConfig.subtype,
    issuer,
    licences: JSON.stringify(licences),
    entities: JSON.stringify(entities),
    metadata: JSON.stringify(metadata),
    status,
    created: moment().format('YYYY-MM-DD HH:mm:ss')
  };
  console.log(JSON.stringify(data, null, 2));
  return eventLogRepo.create(data);
}

module.exports = logEvent;
