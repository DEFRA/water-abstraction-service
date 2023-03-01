'use strict'

/**
 * Creates a filter object to request returns from the returns service
 * @param  {Object} request   - the HAPI request
 * @param  {Array} documents  - a list of CRM document headers
 * @return {Object}           - filter object for returns API request
 */
const createReturnsFilter = (request, documents) => {
  const { query } = request

  const filters = {
    startDate: { key: 'start_date.$gte', value: query.startDate },
    endDate: { key: 'end_date.$lte', value: query.endDate },
    isSummer: { key: 'metadata->>isSummer', value: query.isSummer ? 'true' : 'false' },
    status: { key: 'status', value: query.status },
    excludeNaldReturns: { key: 'end_date.$gte', value: '2018-10-31' }
  }

  const baseFilter = {
    'metadata->>isCurrent': 'true',
    licence_ref: {
      $in: documents.map(row => row.system_external_id)
    }
  }

  return Object.keys(request.query).reduce((acc, queryParam) => {
    set(acc, filters[queryParam].key, filters[queryParam].value)

    return acc
  }, baseFilter)
}

const set = (obj, path, value) => {
  const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g)

  pathArray.reduce((acc, key, i) => {
    if (acc[key] === undefined) acc[key] = {}
    if (i === pathArray.length - 1) acc[key] = value
    return acc[key]
  }, obj)
  return obj
}

exports.createReturnsFilter = createReturnsFilter
