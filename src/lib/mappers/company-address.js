const CompanyAddress = require('../models/company-address');
const DateRange = require('../models/date-range');

const addressMapper = require('./address');

const crmToModel = row => {
  const companyAddress = new CompanyAddress(row.companyAddressId);
  companyAddress.fromHash({
    dateRange: new DateRange(row.startDate, row.endDate),
    isDefault: row.isDefault
  });

  if (row.role) companyAddress.roleName = row.role.name;
  if (row.address) companyAddress.address = addressMapper.crmToModel(row.address);

  return companyAddress;
};

exports.crmToModel = crmToModel;
