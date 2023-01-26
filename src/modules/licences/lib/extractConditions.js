'use strict'

const { createUniqueId } = require('../../../lib/licence-transformer/nald-helpers')
const type = 'conditions'

const mapConditions = (purposeText, conditions = []) => {
  return conditions.map(condition => {
    const { FGAC_REGION_CODE: regionCode, ID: id } = condition

    return {
      purposeText,
      regionCode,
      id: createUniqueId(type, regionCode, id),
      code: condition.condition_type.CODE,
      subCode: condition.condition_type.SUBCODE,
      text: condition.TEXT,
      parameter1: condition.PARAM1,
      parameter2: condition.PARAM2
    }
  })
}

/**
 * Extracts all licence conditions across all purposes within a licence.
 */
const extractConditions = (licence = {}) => {
  const purposes = licence.purposes ? licence.purposes : []

  return purposes.reduce((conditions, purpose) => {
    const purposeText = purpose.purpose[0].purpose_tertiary.DESCR
    const { licenceConditions } = purpose
    return [...conditions, ...mapConditions(purposeText, licenceConditions)]
  }, [])
}

module.exports = extractConditions
