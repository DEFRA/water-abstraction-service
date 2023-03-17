'use strict'

const evt = require('../../../lib/event')

/**
 * Get a list of unique entities, including individals and companies,
 * for the supplied contact data list
 * @param {Array} contactData
 * @return {Array} entity ID guids
 */
function getUniqueEntities (contactData) {
  // Create array of affected company/individual entity IDs
  const entities = []
  contactData.forEach(row => {
    entities.push(row.contact.contact.entity_id)
    row.contact.licences.forEach(licence => {
      entities.push(licence.company_entity_id)
    })
  })

  return [...new Set(entities.filter(x => x))]
}

/**
 * Create event for logging sent notification
 * @param {String} issuer - the email address of person issuing notification
 * @param {Object} taskConfig - the config data from water.task_config table
 * @param {Array} contactData - list of contacts with licences attached
 * @param {String} ref - unique reference for this batch
 */
function eventFactory (issuer, taskConfig, contactData, ref) {
  // Create array of affected licence numbers
  const licences = contactData.reduce((acc, row) => {
    const licenceNumbers = row.contact.licences.map(item => item.system_external_id)
    return [...acc, ...licenceNumbers]
  }, [])

  const uniqueEntities = getUniqueEntities(contactData)

  return evt.create({
    referenceCode: ref,
    type: taskConfig.type,
    subtype: taskConfig.subtype,
    issuer,
    licences,
    entities: uniqueEntities,
    metadata: {
      name: taskConfig.config.name,
      recipients: contactData.length,
      pending: contactData.length,
      sent: 0,
      error: 0,
      taskConfigId: taskConfig.task_config_id
    },
    status: 'sending'
  })
}

module.exports = eventFactory
