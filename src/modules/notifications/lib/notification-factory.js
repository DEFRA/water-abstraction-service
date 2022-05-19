const { logger } = require('../../../logger')
const { identity } = require('lodash')

const mapAddressLine = str => (str || '').trim()

const formatAddress = contact => {
  // Format name
  const { salutation, forename, name, postcode } = contact
  const fullName = [salutation, forename, name].filter(identity).join(' ')

  // Format address lines
  const addressLines = [
    fullName,
    contact.address_1,
    contact.address_2,
    contact.address_3,
    contact.address_4,
    contact.town,
    contact.county
  ]

  // Notify can only accept a max of 6 address lines plus postcode
  // so we omit county as postcode is sufficient
  const finalAddressLines = addressLines
    .map(mapAddressLine)
    .filter(identity)
    .slice(0, 6)

  // Format personalisation with address lines and postcode
  return finalAddressLines.reduce((acc, line, i) => {
    return {
      ...acc,
      [`address_line_${i + 1}`]: line
    }
  }, { postcode })
}

/**
 * Compose and send a single message with notify
 * @param {Object} contactData
 * @param {Object} taskConfig
 * @param {Object} event
 * @return {Object} ScheduledNotification instance
 */
async function notificationFactory (contactData, taskConfig, event) {
  const { entity_id: entityId } = contactData.contact.contact

  // Compose notify personalisation
  const personalisation = {
    body: contactData.output,
    heading: taskConfig.config.subject,
    subject: taskConfig.config.subject,
    ...formatAddress(contactData.contact.contact)
  }

  // Get data for logging
  const licenceNumbers = contactData.contact.licences.map(row => row.system_external_id)
  const companyEntityId = contactData.contact.licences.reduce((acc, licence) => {
    return acc || licence.company_entity_id
  }, null)

  try {
    const { eventId } = event

    const options = {
      messageRef: contactData.contact.method === 'email' ? 'notification_email' : 'notification_letter',
      recipient: contactData.contact.contact.email || 'n/a',
      personalisation,
      licences: licenceNumbers,
      individualEntityId: entityId,
      companyEntityId,
      eventId
    }

    return options
  } catch (error) {
    logger.error('Notification Factory error', error)
    return { error }
  }
}

module.exports = notificationFactory
