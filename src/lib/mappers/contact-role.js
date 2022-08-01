'use strict'

const ContactRole = require('../models/contact-role')

const crmToModel = entity => {
  const role = new ContactRole(entity.roleId)
  return role.pickFrom(entity, ['name', 'dateCreated', 'dateUpdated'])
}

exports.crmToModel = crmToModel
