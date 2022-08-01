'use strict'

const companiesRepo = require('../connectors/crm-v2/companies')
const companyContactMapper = require('../mappers/company-contact')

const getCompanyContacts = async companyId => {
  const companyContacts = await companiesRepo.getCompanyContacts(companyId)
  return companyContacts.map(companyContactMapper.crmToModel)
}

const patchCompanyContact = companiesRepo.patchCompanyContact

const postCompanyContact = companiesRepo.postCompanyContact

const deleteCompanyContact = companiesRepo.deleteCompanyContact

exports.getCompanyContacts = getCompanyContacts
exports.patchCompanyContact = patchCompanyContact
exports.postCompanyContact = postCompanyContact
exports.deleteCompanyContact = deleteCompanyContact
