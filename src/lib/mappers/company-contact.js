'use strict'

const CompanyContact = require('../models/company-contact')
const contactRoleMapper = require('./contact-role')
const contactMapper = require('./contact')
const DateRange = require('../models/date-range')

const crmToModel = entity => {
  const companyContact = new CompanyContact(entity.companyContactId)
  companyContact.pickFrom(entity, [
    'companyId',
    'roleId',
    'isDefault',
    'waterAbstractionAlertsEnabled',
    'dateCreated',
    'dateUpdated'
  ])

  companyContact.dateRange = new DateRange(entity.startDate, entity.endDate)

  if (entity.role) {
    companyContact.role = contactRoleMapper.crmToModel(entity.role)
  }

  if (entity.contact) {
    companyContact.contact = contactMapper.crmToModel(entity.contact)
  } else if (entity.contactId) {
    companyContact.contact = contactMapper.crmToModel({ contactId: entity.contactId })
  }

  return companyContact
}

exports.crmToModel = crmToModel
