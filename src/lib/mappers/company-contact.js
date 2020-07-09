'use strict';

const CompanyContact = require('../models/company-contact');
const contactRoleMapper = require('./contact-role');
const contactMapper = require('./contact');

const crmToModel = entity => {
  const companyContact = new CompanyContact(entity.companyContactId);
  companyContact.pickFrom(entity, [
    'contactId',
    'roleId',
    'isDefault',
    'startDate',
    'endDate',
    'dateCreated',
    'dateUpdated'
  ]);

  if (entity.role) {
    companyContact.role = contactRoleMapper.crmToModel(entity.role);
  }

  if (entity.contact) {
    companyContact.contact = contactMapper.crmToModel(entity.contact);
  }
  return companyContact;
};

exports.crmToModel = crmToModel;
