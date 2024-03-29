'use strict'

const Contact = require('../models/contact-v2')

const { createMapper } = require('../object-mapper')
const { createModel } = require('./lib/helpers')

/**
 * Maps a row of CRM v2 contact data to a Contact instance
 * @param {Object} contactData
 * @return {Contact}
 */
const crmToModelMapper = createMapper()
  .copy(
    'salutation',
    'firstName',
    'initials',
    'middleInitials',
    'lastName',
    'suffix',
    'department',
    'email',
    'dataSource',
    'isTest'
  )
  .map('contactId').to('id')
  .map('contactType').to('type')

const crmToModel = row => createModel(Contact, row, crmToModelMapper)

/**
 * Maps only an id or new contact data from the UI
 * @param {Object} contactData from UI
 * @return {Contact}
 */
const uiToModel = contactData => {
  if (!contactData) return null
  if (contactData.contactId) {
    return new Contact(contactData.contactId)
  }
  const contact = new Contact()
  contact.dataSource = contactData.source || Contact.DATA_SOURCE_TYPES.wrls
  const contactDataOmit = { ...contactData }
  delete contactDataOmit.source
  return contact.fromHash(contactDataOmit)
}

/**
 * Maps data from contact service model to expected crm shape
 * @param {Contact} contact service model
 * @return {Object}
 */
const modelToCrm = contact => {
  const data = contact.toJSON()
  delete data.fullName
  return {
    ...data
  }
}

const pojoToModel = object => {
  if (!(object instanceof Object)) {
    return null
  }
  const model = new Contact()
  return model.pickFrom(object, [
    'id',
    'firstName',
    'initials',
    'middleInitials',
    'lastName',
    'suffix',
    'department',
    'type',
    'dataSource',
    'salutation'
  ])
}

exports.crmToModel = crmToModel
exports.uiToModel = uiToModel
exports.modelToCrm = modelToCrm
exports.pojoToModel = pojoToModel
