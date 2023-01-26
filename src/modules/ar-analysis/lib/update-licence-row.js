'use strict'

const ExtendableError = require('es6-error')
const { throwIfError } = require('@envage/hapi-pg-rest-api')

const permit = require('../../../lib/connectors/permit')
const { logger } = require('../../../logger')
const { licence, abstractionReform } = require('../../../../config')
const { mapLicenceToTableRow } = require('./licence-row-mapper')
const arAnalysis = require('../../../controllers/ar-analysis-licences.js')

class NotFoundError extends ExtendableError {};

const getLicenceTypeFilter = (config) => {
  const { regimeId, typeId } = config
  return {
    licence_regime_id: regimeId,
    licence_type_id: typeId
  }
}

/**
 * Gets permit repo filter
 * @param {String} licenceRef - the licence number
 * @param {Object} config - permit repo config data
 * @param {Number} config.regimeId - the regime ID in permit repo
 * @param {Number} config.typeId - the licence type ID in permit repo
 * @return {Object} filter object for permit repo API
 */
const getPermitFilter = (licenceRef, config) => {
  return {
    ...getLicenceTypeFilter(config),
    licence_ref: licenceRef
  }
}

/**
 * Gets a licence from the permit repo API
 * @param {String} licenceRef - the licence number
 * @param {Object} config
 * @param {Number} config.regimeId - permit repo regime ID
 * @param {Number} config.typeId - permit repo licence type ID
 * @return {Promise} resolves with licence data
 */
const getLicence = async (licenceRef, config) => {
  const filter = getPermitFilter(licenceRef, config)
  const { error, data: [row] } = await permit.licences.findMany(filter)
  throwIfError(error)
  if (!row) {
    throw new NotFoundError(`Licence ${licenceRef} with ${JSON.stringify(config)} not found`)
  }
  return row
}

const hasAbstractionReformActions = licence =>
  (licence.licence_data_value.actions ? licence.licence_data_value.actions : []).length > 0

/**
 * Updates the licence analysis table
 * @param {String} licenceRef
 * @return {Promise} resolves with row of data for licence analysis table
 */
const updateLicenceRow = async (licenceRef) => {
  // Get base and AR licences
  const ar = await getLicence(licenceRef, abstractionReform)

  if (!hasAbstractionReformActions(ar)) {
    return { error: null, data: 'No AR for licence yet', licenceRef }
  }

  const base = await getLicence(licenceRef, licence)

  // Map data to analysis row
  const regionCode = base.licence_data_value.FGAC_REGION_CODE
  const arAnalysisRow = mapLicenceToTableRow(regionCode, licenceRef, ar.licence_data_value)

  // Persist to DB analysis table
  const result = await arAnalysis.repository.create(arAnalysisRow)
  return result.rowCount ? arAnalysisRow : undefined
}

/**
 * Updates the analysis table for all AR licences
 * @return {Promise} resolves when done
 */
const updateAllLicences = async () => {
  const filter = getLicenceTypeFilter(abstractionReform)
  const results = await permit.licences.findAll(filter, {}, ['licence_ref'])
  for (const row of results) {
    const { licence_ref: licenceNumber } = row
    try {
      await updateLicenceRow(licenceNumber)
    } catch (error) {
      logger.error('Error updating all licences', error.stack, { row })
    }
  }
}

module.exports = {
  getPermitFilter,
  getLicence,
  updateLicenceRow,
  updateAllLicences
}
