const Event = require('../../../lib/event');
const { uniq } = require('lodash');

/**
 * Gets licence numbers from list of returns
 * @param {Array} returns - list of returns from returns service
 * @return {Array} unique list of affected licence numbers
 */
const getLicenceNumbers = (returns) => {
  const licenceNumbers = returns.map(row => row.licence_ref);
  return uniq(licenceNumbers);
};

const getReturnIds = (returns) => {
  return returns.map(row => row.return_id);
};

/**
 * Create event for logging sent notification
 * @param {String} issuer - the email address of person issuing notification
 * @param {Object} taskConfig - the config data from water.task_config table
 * @param {Array} returns - list of returns
 * @param {String} ref - unique reference for this batch
 * @param {String} name - a friendly name for this type of notification
 */
function eventFactory (issuer, messageRef, returns, ref, name) {
  // Create array of affected licence numbers
  const licences = getLicenceNumbers(returns);

  const e = new Event();
  e.setReference(ref)
    .setType('notification', messageRef)
    .setIssuer(issuer)
    .setLicenceNumbers(licences)
    .setMetadata({
      name: `Returns: ${name}`,
      returnIds: getReturnIds(returns),
      recipients: returns.length,
      pending: returns.length,
      sent: 0,
      error: 0
    })
    .setStatus('sending');

  return e;
}

module.exports = eventFactory;
