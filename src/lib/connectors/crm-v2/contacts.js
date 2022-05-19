'use strict'

const urlJoin = require('url-join')
const { serviceRequest } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')

const getUri = (...tail) => urlJoin(config.services.crm_v2, 'contacts', ...tail)

/**
 * Get a single contact
 * @param {String} contactId The uuid of the contact to retrieve
 */
const getContact = contactId => {
  const uri = getUri(contactId)
  return serviceRequest.get(uri)
}

/**
 * Gets the contacts for the given contact ids
 * @param {Array<String>} contactIds The array of contact id uuids to fetch
 */
const getContacts = contactIds => {
  return serviceRequest.get(getUri(), {
    qs: { id: contactIds },
    qsStringifyOptions: { arrayFormat: 'repeat' }
  })
}

/**
 * Creates a contact entity in the CRM
 *
 * @param {Object} contact The contact data
 */
const createContact = async contact => {
  return serviceRequest.post(
    getUri(),
    { body: contact }
  )
}

const deleteContact = async contactId => serviceRequest.delete(getUri(contactId))

const patchContact = async (contactId, payload) => serviceRequest.patch(getUri(contactId), {
  body: payload
})

exports.createContact = createContact
exports.getContact = getContact
exports.getContacts = getContacts
exports.deleteContact = deleteContact
exports.patchContact = patchContact
