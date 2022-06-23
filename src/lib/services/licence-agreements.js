'use strict'

const config = require('../../../config')

const { NotFoundError, ConflictingDataError } = require('../errors')

// Mappers
const licenceAgreementMapper = require('../mappers/licence-agreement')

// Repos
const licenceAgreementRepo = require('../connectors/repos/licence-agreements')

// Models
const DateRange = require('../models/date-range')
const Licence = require('../models/licence')
const LicenceAgreement = require('../models/licence-agreement')
const validators = require('../models/validators')
const Event = require('../models/event')

// Services
const agreementsService = require('./agreements')
const licencesService = require('./licences')
const service = require('./service')
const eventService = require('./events')

const EVENT_TYPES = {
  create: {
    type: 'licence-agreement:create',
    status: 'created'
  },
  update: {
    type: 'licence-agreement:update',
    status: 'updated'
  },
  delete: {
    type: 'licence-agreement:delete',
    status: 'deleted'
  }
}

const getLicenceAgreementsByLicenceRef = async licenceRef =>
  service.findMany(
    licenceRef,
    licenceAgreementRepo.findByLicenceRef,
    licenceAgreementMapper
  )

const getLicenceAgreementById = async licenceAgreementId =>
  service.findOne(
    licenceAgreementId,
    licenceAgreementRepo.findOne,
    licenceAgreementMapper
  )

const createEvent = (eventType, licenceAgreement, issuer) => {
  const event = new Event().fromHash({
    issuer: issuer.email,
    ...eventType,
    licences: [licenceAgreement.licenceNumber],
    metadata: licenceAgreement.toJSON()
  })
  return eventService.create(event)
}

const deleteLicenceAgreementById = async (licenceAgreementId, issuer) => {
  // Get the licence agreement
  const licenceAgreement = await getLicenceAgreementById(licenceAgreementId)
  if (!licenceAgreement) {
    throw new NotFoundError(`Licence agreement ${licenceAgreementId} not found`)
  }

  // Delete
  await licenceAgreementRepo.softDeleteOne(licenceAgreementId)

  // Get licence
  const licence = await licencesService.getLicenceByLicenceRef(licenceAgreement.licenceNumber)

  // Log event and flag licence for supplementary billing
  return Promise.all([
    createEvent(EVENT_TYPES.delete, licenceAgreement, issuer),
    new Date(licenceAgreement.dateRange.startDate) < new Date(config.billing.srocStartDate) && licencesService.flagForSupplementaryBilling(licence.id)
  ])
}

/**
 * Gets the Agreement model by code
 * If not found, a NotFoundError is thrown
 * @param {String} code
 * @return {Promise<Agreement>}
 */
const fetchAgreement = async code => {
  const agreement = await agreementsService.getAgreementByCode(code)
  if (!agreement) {
    throw new NotFoundError(`Financial agreement ${code} not found`)
  }
  return agreement
}

/**
 * Adds a new financial agreement to the specified licence
 * @param {Licence} licence
 * @param {Object} data - data for the licence agreement
 * @param {String} data.code - the financial agreement code
 * @param {String} data.startDate - effective start date of agreement
 * @param {String} data.dateSigned - date signed by customer
 * @param {User} issuer
 */
const createLicenceAgreement = async (licence, data, issuer) => {
  validators.assertIsInstanceOf(licence, Licence)
  const { code } = data

  // Get financial agreement by code
  const agreement = await fetchAgreement(code)

  // Construct licence agreement model
  const licenceAgreement = new LicenceAgreement().fromHash({
    licenceNumber: licence.licenceNumber,
    dateRange: new DateRange(data.startDate),
    dateSigned: data.dateSigned,
    agreement
  })

  try {
    // Persist new row in water.licence_agreements
    const { licenceAgreementId } = await licenceAgreementRepo.create(
      licenceAgreementMapper.modelToDb(licenceAgreement)
    )

    licenceAgreement.id = licenceAgreementId

    // Log event and flag licence for supplementary billing
    await Promise.all([
      createEvent(EVENT_TYPES.create, licenceAgreement, issuer),
      new Date(licenceAgreement.dateRange.startDate) < new Date(config.billing.srocStartDate) && licencesService.flagForSupplementaryBilling(licence.id)
    ])

    // Return the updated model
    return licenceAgreement
  } catch (err) {
    if (err.code === '23505') {
      throw new ConflictingDataError(`A ${code} agreement starting on ${data.startDate} already exists for licence ${licence.licenceNumber}`)
    }
    throw err
  }
}

/**
 * Patch an existing licence agreement
 * @param {String} agreemntId
 * @param {Object} data - data for the licence agreement
 * @param {String} data.endDate - the agreement end date
 * @param {User} issuer
 */
const patchLicenceAgreement = async (licenceAgreementId, data, issuer) => {
  const licenceAgreement = await getLicenceAgreementById(licenceAgreementId)
  if (!licenceAgreement) {
    throw new NotFoundError(`Licence agreement ${licenceAgreementId} not found`)
  }
  // Patch
  const response = await licenceAgreementRepo.update(licenceAgreementId, data)

  // Log event and flag licence for supplementary billing
  return Promise.all([
    createEvent(EVENT_TYPES.update, licenceAgreement, issuer),
    new Date(licenceAgreement.dateRange.startDate) < new Date(config.billing.srocStartDate) && licencesService.flagForSupplementaryBilling(response.licence.licenceId)
  ])
}

exports.getLicenceAgreementById = getLicenceAgreementById
exports.getLicenceAgreementsByLicenceRef = getLicenceAgreementsByLicenceRef
exports.deleteLicenceAgreementById = deleteLicenceAgreementById
exports.createLicenceAgreement = createLicenceAgreement
exports.patchLicenceAgreement = patchLicenceAgreement
