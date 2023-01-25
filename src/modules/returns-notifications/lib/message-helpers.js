const { mapKeys, get } = require('lodash')

/**
 * Create job data for a returns notification message regarding a return to
 * be placed on the message queue
 * @param {Object} ret - return row
 * @param {Object} event - event
 */
const getJobData = (ret, event, messageRef, config) => {
  const { eventId } = event
  return {
    returnId: ret.return_id,
    licenceNumber: ret.licence_ref,
    eventId,
    messageRef,
    config
  }
}

/**
 * Converts keys with format address_<i> to address_line_<i> to match the
 * format required by the GOV.UK Notify API
 * @param {Object} contact - with address keys in format  address_<i>
 * @return {Object} -  with address keys in format  address_line_<i>
 */
const formatAddressKeys = (contact) => {
  return mapKeys(contact, (value, key) => {
    return key.replace(/^address_(?=[0-9])/, 'address_line_')
  })
}

/**
 * Formats personalisation object
 * @param {Object} ret - the return row
 * @param {Object} contact - a contact from getting contact list call
 * @return {Object}
 */
const formatEnqueuePersonalisation = (ret, contact) => {
  const {
    start_date: startDate,
    end_date: endDate,
    returns_frequency: returnsFrequency,
    return_id: returnId,
    licence_ref: licenceRef,
    due_date: dueDate
  } = ret

  const purposes = get(ret, 'metadata.purposes', [])
  const purpose = purposes.map(purpose => purpose.tertiary.description).join(', ')

  const metadata = ret.metadata || {}
  const nald = metadata.nald

  const picked = { formatId: nald.formatId, regionCode: nald.regionCode }
  if (nald.areaCode) {
    picked.areaCode = nald.areaCode
  }
  return {
    ...formatAddressKeys(contact),
    licenceRef,
    ...picked,
    siteDescription: metadata.description,
    isTwoPartTariff: metadata.isTwoPartTariff,
    qrUrl: returnId,
    purpose,
    startDate,
    endDate,
    dueDate,
    returnsFrequency
  }
}

/**
 * Formats data for passing to the enqueue() method for sending by the Notify
 * module
 * @param {Object} data - the message data from the job
 * @param {String} data.eventId - the event ID for the message queue
 * @param {String} data.messageRef - the message template
 * @param {Object} ret - return object from returns service
 * @param {Object} contactData - contact data, including address for sending
 * @return {Object} message data for enqueue()
 */
const formatEnqueueOptions = (data, ret, contactData) => {
  const {
    return_id: returnId,
    licence_ref: licenceNumber
  } = ret
  const { eventId, messageRef } = data

  const { entity_id: entityId, ...contact } = contactData.contact

  const personalisation = formatEnqueuePersonalisation(ret, contact)

  return {
    messageRef,
    personalisation,
    licences: [licenceNumber],
    individualEntityId: contactData.contact.entity_id || null,
    companyEntityId: null,
    eventId,
    messageType: 'letter',
    metadata: {
      returnId
    }
  }
}

module.exports = {
  getJobData,
  formatAddressKeys,
  formatEnqueueOptions
}
