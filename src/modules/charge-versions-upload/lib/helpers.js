'use strict'

const { assertDate, assertLicenceNumber } = require('../../../lib/models/validators')
const licencesService = require('../../../lib/services/licences')
const documentsService = require('../../../lib/services/documents-service')
const { billing } = require('../../../../config')
const companiesService = require('../../../lib/services/companies-service')
const chargeVersionsService = require('../../../lib/services/charge-versions')
const repos = require('../../../lib/connectors/repos')
const eventsService = require('../../../lib/services/events')
const { logger } = require('../../../logger')

const IMPORTED_REASON = 'Strategic review of charges (SRoC)'

const cache = {}

const parseFactor = factor => {
  switch (factor) {
    case '1':
    case '': return null
    default: return factor
  }
}

const parseBool = bool => {
  switch (bool) {
    case 'Y': return true
    case 'N': return false
    default: return null
  }
}

const formatDate = date => {
  try {
    const [day, month, year] = date.split('/')
    const formattedDate = `${year}-${month}-${day}`
    assertDate(formattedDate)
    return new Date(formattedDate)
  } catch (_e) {
    return null
  }
}

const deepFreeze = obj => {
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      deepFreeze(obj[key])
    }
  }
  return Object.freeze(obj)
}

const getLicence = async licenceNumber => {
  if (!cache.licences) {
    cache.licences = {}
  }
  if (!cache.licences[licenceNumber]) {
    assertLicenceNumber(licenceNumber)
    // Only include required properties
    const { id, startDate, expiredDate, lapsedDate, revokedDate, regionalChargeArea, isWaterUndertaker } = await licencesService.getLicenceByLicenceRef(licenceNumber)
    cache.licences[licenceNumber] = deepFreeze({ id, licenceNumber, startDate, expiredDate, lapsedDate, revokedDate, regionalChargeArea, isWaterUndertaker })
  }
  return cache.licences[licenceNumber]
}

const getInvoiceAccount = async (licence, invoiceAccountNumber) => {
  if (!cache.invoiceAccounts) {
    cache.invoiceAccounts = {}
  }
  const { licenceNumber } = licence
  const key = `${licenceNumber}:::${invoiceAccountNumber}`
  if (!cache.invoiceAccounts[key]) {
    if (invoiceAccountNumber) {
      const document = await documentsService.getValidDocumentOnDate(licenceNumber, billing.srocStartDate)
      const licenceHolder = document.roles.find(role => role.roleName === 'licenceHolder')
      const invoiceAccounts = await companiesService.getCompanyInvoiceAccounts(licenceHolder.company.id)
      cache.invoiceAccounts[key] = deepFreeze(invoiceAccounts.find(account => account.accountNumber === invoiceAccountNumber))
    } else {
      const chargeVersions = await chargeVersionsService.getByLicenceRef(licenceNumber)
      const chargeVersion = chargeVersions.find(version => !version.dateRange.endDate && version.status === 'current')
      if (chargeVersion) {
        const { invoiceAccount } = await chargeVersionsService.getByIdWithInvoiceAccount(chargeVersion.id)
        cache.invoiceAccounts[key] = deepFreeze(invoiceAccount)
      }
    }
  }
  return cache.invoiceAccounts[key]
}

const getPurposeUses = async () => {
  if (!cache.purposeUses) {
    const purposeUses = await repos.purposeUses.findAll()
    const uses = purposeUses.map(({ purposeUseId, description, isTwoPartTariff }) => ({ purposeUseId, description, isTwoPartTariff }))
    cache.purposeUses = deepFreeze(uses)
  }
  return cache.purposeUses
}

const getPurposeUse = async (description) => {
  const purposeUses = await getPurposeUses()
  return purposeUses.find(purposeUse => purposeUse.description === description)
}

const getSupportedSources = async () => {
  if (!cache.supportedSources) {
    const supportedSources = await repos.supportedSources.findAll()
    // Only name and billingSupportedSourceId required
    const sources = supportedSources.map(({ name, billingSupportedSourceId }) => ({ name, billingSupportedSourceId }))
    cache.supportedSources = deepFreeze(sources)
  }
  return cache.supportedSources
}

const getChangeReason = async () => {
  if (!cache.changeReason) {
    const changeReason = await repos.changeReasons.findOneByDescription(IMPORTED_REASON)
    const { changeReasonId, type, description, triggersMinimumCharge, isEnabledForNewChargeVersions } = changeReason
    cache.changeReason = deepFreeze({ changeReasonId, type, description, triggersMinimumCharge, isEnabledForNewChargeVersions })
  }
  return cache.changeReason
}

const clearCache = () => {
  for (const key in cache) {
    delete cache[key]
  }
}

const updateEventStatus = async (event, statusMessage, jobName) => {
  logger.info(`${jobName}: ${statusMessage}`)

  if (!event.metadata) {
    event.metadata = {}
  }
  event.metadata.statusMessage = statusMessage
  return eventsService.update(event)
}

module.exports = {
  parseFactor,
  parseBool,
  formatDate,
  getLicence,
  getInvoiceAccount,
  getPurposeUses,
  getPurposeUse,
  getSupportedSources,
  getChangeReason,
  clearCache,
  updateEventStatus
}
