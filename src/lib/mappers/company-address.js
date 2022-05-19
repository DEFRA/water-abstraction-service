const CompanyAddress = require('../models/company-address')
const DateRange = require('../models/date-range')
const Address = require('../models/address')

const addressMapper = require('./address')

const crmToModel = row => {
  const companyAddress = new CompanyAddress(row.companyAddressId)
  companyAddress.fromHash({
    dateRange: new DateRange(row.startDate, row.endDate),
    companyId: row.companyId,
    isDefault: row.isDefault
  })

  if (row.role) companyAddress.roleName = row.role.name
  if (row.address) {
    companyAddress.address = addressMapper.crmToModel(row.address)
  } else if (row.addressId) {
    companyAddress.address = new Address(row.addressId)
  }

  return companyAddress
}

exports.crmToModel = crmToModel
