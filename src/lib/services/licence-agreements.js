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
const system = require('../connectors/system/licence-supplementary-billing.js')

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

  // Flag for pre sroc supplementary billing
  await _flagForPreSrocSupplementaryBilling(licenceAgreement.dateRange.startDate, licence.id)
  // Log event
  await createEvent(EVENT_TYPES.delete, licenceAgreement, issuer)
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

    // Flag for pre sroc supplementary billing
    await _flagForPreSrocSupplementaryBilling(licenceAgreement.dateRange.startDate, licence.id)

    // Log event
    await createEvent(EVENT_TYPES.create, licenceAgreement, issuer)

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
 * @param {String} agreementId
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

  // Flag for pre sroc supplementary billing
  await _flagForPreSrocSupplementaryBilling(licenceAgreement.dateRange.startDate, response.licence.licenceId)

  // Log event
  await createEvent(EVENT_TYPES.update, licenceAgreement, issuer)
}

/**
 * Flag for pre-sroc supplementary billing
 *
 * Changes to the licence agreement could mean flagging it for pre-sroc supplementary billing
 * If the licence agreement start date is before the start of sroc billing (1st April 2022), then we flag it for
 * pre-sroc supplementary billing. We do not flag for sroc or two-part tariff supplementary billing for changing to the
 * licence agreement. This is because the licence agreements has no affect on licences being picked up for sroc and two
 * part tariff billing.
 *
 * @private
 */
const _flagForPreSrocSupplementaryBilling = async (startDate, licenceId) => {
  if (new Date(startDate) < new Date(config.billing.srocStartDate)) {
    await system.licenceFlagSupplementaryBilling(licenceId, 'alcs')
  }
}

exports.getLicenceAgreementById = getLicenceAgreementById
exports.getLicenceAgreementsByLicenceRef = getLicenceAgreementsByLicenceRef
exports.deleteLicenceAgreementById = deleteLicenceAgreementById
exports.createLicenceAgreement = createLicenceAgreement
exports.patchLicenceAgreement = patchLicenceAgreement
