const { get, uniqBy } = require('lodash')
const { createUniqueId } = require('../../../lib/licence-transformer/nald-helpers')
const type = 'points'

const mapPoints = (points = []) => {
  return points.map(point => {
    const { ID: id, FGAC_REGION_CODE: regionCode } = point.point_detail
    return {
      id: createUniqueId(type, regionCode, id),
      name: point.point_detail.LOCAL_NAME
    }
  })
}

/**
 * Extracts all licence abstraction points across all purposes within a licence.
 */
const extractPoints = (licence = {}) => {
  const purposes = get(licence, 'purposes', [])

  const extractedPoints = purposes.reduce((points, purpose) => {
    const { purposePoints } = purpose
    return [...points, ...mapPoints(purposePoints)]
  }, [])

  return uniqBy(extractedPoints, 'id')
}

module.exports = extractPoints
