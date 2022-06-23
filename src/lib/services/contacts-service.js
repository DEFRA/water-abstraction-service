'use strict'

const contactsConnector = require('../connectors/crm-v2/contacts')
const mappers = require('../../modules/billing/mappers')
const { InvalidEntityError } = require('../errors')

const getContact = async contactId => {
  const contact = await contactsConnector.getContact(contactId)
  return mappers.contact.crmToModel(contact)
}

/**
 * Gets contacts from CRM v2 API and returns as Contact models
 * @param {Array<String>} contactIds
 * @return {Promise<Array>}
 */
const getContacts = async contactIds => {
  const contacts = await contactsConnector.getContacts(contactIds)
  return contacts.map(mappers.contact.crmToModel)
}

const createContact = async contactModel => {
  const contact = await contactsConnector.createContact(mappers.contact.modelToCrm(contactModel))
  return mappers.contact.crmToModel(contact)
}

const patchContact = async (contactId, payload) => {
  const contact = await contactsConnector.patchContact(contactId, payload)
  return mappers.contact.crmToModel(contact)
}

const deleteContact = async contact => contactsConnector.deleteContact(contact.id)

const getContactModel = contactData => {
  if (!contactData) return null
  const contactModel = mappers.contact.uiToModel(contactData)
  if (!contactModel.id && !!contactModel) {
    const { error } = contactModel.isValid()
    if (error) throw new InvalidEntityError('Invalid contact', error)
  };
  return contactModel
}

exports.getContact = getContact
exports.getContacts = getContacts
exports.createContact = createContact
exports.patchContact = patchContact
exports.deleteContact = deleteContact
exports.getContactModel = getContactModel
