'use strict'

const moment = require('moment')
const DATE_FORMAT = 'YYYY-MM-DD'

// Repos
const chargeVersionRepo = require('../connectors/repos/charge-versions')
const chargeVersionMapper = require('../mappers/charge-version')

const noteRepo = require('../connectors/repos/notes')
const noteMapper = require('../mappers/note')

// Services
const service = require('./service')
const notesService = require('./notes-service')
const chargeElementsService = require('./charge-elements')
const invoiceAccountsService = require('./invoice-accounts-service')

// Models
const ChargeVersion = require('../models/charge-version')

const validators = require('../models/validators')

/**
 * Gets charge version by ID
 * @param {String} chargeVersionId
 * @return {Promise<ChargeVersion>}
 */
const getByChargeVersionId = async chargeVersionId =>
  service.findOne(
    chargeVersionId,
    chargeVersionRepo.findOne,
    chargeVersionMapper
  )

const getManyByChargeVersionIds = async ids => {
  const result = await chargeVersionRepo.findMany(ids)
  return result.map(chargeVersionMapper.dbToModel)
}

/**
 * Gets a charge version from the DB including the related
 * invoice account
 * @param {String} chargeVersionId
 */
const getByIdWithInvoiceAccount = async chargeVersionId => {
  const chargeVersion = await getByChargeVersionId(chargeVersionId)
  return chargeVersion && invoiceAccountsService.decorateWithInvoiceAccount(chargeVersion)
}

/**
 * Gets all the charge versions for the given licence ref
 *
 * @param {String} licenceRef The licence ref/number
 */
const getByLicenceRef = async licenceRef =>
  service.findMany(
    licenceRef,
    chargeVersionRepo.findByLicenceRef,
    chargeVersionMapper
  )

/**
 * Gets all the charge versions for the given licence ref
 *
 * @param {String} licenceId The licence id
 */
const getByLicenceId = async licenceId => {
  const chargeVersions = await service.findMany(
    licenceId,
    chargeVersionRepo.findByLicenceId,
    chargeVersionMapper
  )
  return Promise.all(chargeVersions.map(async chargeVersion => notesService.decorateWithNote(chargeVersion)))
}

/**
 * Persists a new charge version in the DB
 * @param {ChargeVersion} chargeVersion
 * @return {Promise<ChargeVersion>} persisted charge version
 */
const persist = async chargeVersion => {
  validators.assertIsInstanceOf(chargeVersion, ChargeVersion)

  // Persist charge version
  const dbRow = chargeVersionMapper.modelToDb(chargeVersion)
  const result = await chargeVersionRepo.create(dbRow)
  const persistedChargeVersion = chargeVersionMapper.dbToModel(result)

  // Persist note
  const { note } = chargeVersion
  if (note) {
    note.typeId = persistedChargeVersion.id
    const noteDbRow = await noteRepo.create(noteMapper.modelToDb(note))
    persistedChargeVersion.note = noteMapper.dbToModel(noteDbRow)

    // Update the charge version with the note id
    await chargeVersionRepo.update(persistedChargeVersion.id, { noteId: persistedChargeVersion.note.id })
  }

  // Persist charge elements
  const tasks = chargeVersion.chargeElements.map(chargeElement =>
    chargeElementsService.create(persistedChargeVersion, chargeElement)
  )
  persistedChargeVersion.chargeElements = await Promise.all(tasks)

  return persistedChargeVersion
}

const isCurrentChargeVersion = chargeVersion => chargeVersion.status === ChargeVersion.STATUS.current
const getStartDate = chargeVersion => chargeVersion.dateRange.startDate

/**
 * Updates all the end dates of the current charge versions so they end
 * the day before the next one in the sequence begins.
 * @param {Array<ChargeVersion>} chargeVersions
 */
const refreshEndDates = chargeVersions => {
  const filtered = chargeVersions.filter(isCurrentChargeVersion)
  const sorted = filtered.sort((a, b) => {
    return new Date(getStartDate(a)) - new Date(getStartDate(b))
  })

  return sorted.map((chargeVersion, i, arr) => {
    const isLast = i === arr.length - 1
    chargeVersion.dateRange.endDate = isLast
      ? null
      : moment(arr[i + 1].dateRange.startDate, DATE_FORMAT).subtract(1, 'day').format(DATE_FORMAT)
    return chargeVersion
  })
}

/**
 * If there is an existing current charge version that starts on the same day
 * as the newly created one, the new one replaces it.
 * Therefore the existing charge version has its status set to 'superseded'
 * @param {ChargeVersion} newChargeVersion
 * @param {Array<ChargeVersion>} existingChargeVersions
 */
const refreshStatus = (newChargeVersion, existingChargeVersions) => {
  const filtered = existingChargeVersions.filter(isCurrentChargeVersion)
  return filtered.map(chargeVersion => {
    if (chargeVersion.dateRange.startDate === newChargeVersion.dateRange.startDate) {
      chargeVersion.status = ChargeVersion.STATUS.superseded
    }
    return chargeVersion
  })
}

const getNextVersionNumber = existingChargeVersions => existingChargeVersions.reduce((acc, chargeVersion) =>
  Math.max(acc, chargeVersion.versionNumber + 1)
, 1)

/**
 * Updates an array of charge versions with the current status/end date
 * @param {Array<ChargeVersion>} existingChargeVersions
 */
const updateExistingChargeVersions = existingChargeVersions => {
  const tasks = existingChargeVersions.map(chargeVersion => {
    const changes = {
      status: chargeVersion.status,
      endDate: chargeVersion.dateRange.endDate
    }
    return chargeVersionRepo.update(chargeVersion.id, changes)
  })
  return Promise.all(tasks)
}

/**
 * Persists a new charge version from the model supplied
 * NB: licence is flagged for supplementary billing
 *     when the charge version workflow is deleted
 * @param {ChargeVersion} chargeVersion
 * @return {Promise<ChargeVersion>}
 */
const create = async chargeVersion => {
  validators.assertIsInstanceOf(chargeVersion, ChargeVersion)
  const { licence } = chargeVersion

  // Get existing charge versions for licence
  const existingChargeVersions = await getByLicenceRef(licence.licenceNumber)

  // Set additional data on new charge version
  chargeVersion.fromHash({
    source: ChargeVersion.SOURCE.wrls,
    status: ChargeVersion.STATUS.current,
    // TODO: Refactor to query db direct -- get largest chargeVersion value for this licence ref and add 1
    versionNumber: getNextVersionNumber(existingChargeVersions)
  })

  // Refresh statuses and end dates

  // TODO: Refactor to query db direct -- get charge version for this licence with isCurrent, and if start date is the
  // same then mark as superseded [double-check this logic in `refreshStatus`]
  refreshStatus(chargeVersion, existingChargeVersions)

  // TODO: Refactor to query db direct. Get all charge versions for this licence with isCurrent. In order of start date,
  // update the end date of each one to be 1 day before the start date of the next one. And update the end date of the
  // last one to be `null`
  refreshEndDates([chargeVersion, ...existingChargeVersions])

  const [{ id }] = await Promise.all([

    // Persist new charge version
    persist(chargeVersion),

    // Update end date/status on existing charge versions for licence
    // TODO: We can remove this once we've got rid of `existingChargeVersions`
    updateExistingChargeVersions(existingChargeVersions)
  ])

  return getByChargeVersionId(id)
}

exports.getByChargeVersionId = getByChargeVersionId
exports.getManyByChargeVersionIds = getManyByChargeVersionIds
exports.getByIdWithInvoiceAccount = getByIdWithInvoiceAccount
exports.getByLicenceId = getByLicenceId
exports.getByLicenceRef = getByLicenceRef
exports.create = create
