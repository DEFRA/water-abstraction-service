const CompanyContact = require('../models/company-contact');
const DateRange = require('../models/date-range');

const contactMapper = require('./contact');
const { pick } = require('lodash');

const crmToModel = row => {
  const companyContact = new CompanyContact(row.companyContactId);
  companyContact.fromHash({
    ...pick(row, ['emailAddress', 'isDefault']),
    dateRange: new DateRange(row.startDate, row.endDate)
  });

  if (row.role) companyContact.roleName = row.role.name;
  if (row.contact) companyContact.contact = contactMapper.crmToModel(row.contact);

  return companyContact;
};

exports.crmToModel = crmToModel;
