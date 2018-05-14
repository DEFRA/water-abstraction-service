const Event = require('../../../lib/event');
const { uniq } = require('lodash');

/**
 * Log event
 * @param {Object} taskConfig - the config data from water.task_config table
 * @param {String} issuer - the email address of person issuing notification
 * @param {Array} licences - array of licence numbers impacted by event
 * @param {Array} entities - array of CRM entity IDs impaced by event
 * @param {Object} metadata - supplementary event data
 */
function eventFactory (issuer, taskConfig, contactData) {
  // Create array of affected licence numbers
  const licences = contactData.reduce((acc, row) => {
    const licenceNumbers = row.contact.licences.map(item => item.system_external_id);
    return [...acc, ...licenceNumbers];
  }, []);

  // Create array of affected company/individual entity IDs
  const entities = [];
  contactData.forEach(row => {
    entities.push(row.contact.contact.entity_id);
    row.contact.licences.forEach(licence => {
      entities.push(licence.company_entity_id);
    });
  });

  const uniqueEntities = uniq(entities.filter(x => x));

  console.log('unique entity list:', entities, uniqueEntities);

  const e = new Event();
  e.generateReference(taskConfig.config.prefix)
    .setType(taskConfig.type, taskConfig.subtype)
    .setIssuer(issuer)
    .setLicenceNumbers(licences)
    .setEntities(uniqueEntities)
    .setMetadata({
      name: taskConfig.config.name,
      recipients: contactData.length,
      pending: contactData.length,
      sent: 0,
      error: 0,
      taskConfigId: taskConfig.task_config_id
    })
    .setStatus('sending');

  return e;
}

module.exports = eventFactory;
