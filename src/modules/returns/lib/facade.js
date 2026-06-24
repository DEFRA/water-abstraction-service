'use strict'

/**
 * This layer gets return data, and depending on the date, either
 * loads data from the NALD import DB, or direct from the returns service
 */
const apiConnector = require('./api-connector')

/**
 * Gets version and line data from the returns service
 * @param {String} returnId
 * @param {Number} versionNumber
 * @return {Promise<Object>}
 */
const getServiceData = async (returnId, versionNumber) => {
  const version = await apiConnector.fetchVersion(returnId, versionNumber)
  const [versions, lines] = await Promise.all([
    apiConnector.fetchAllVersions(returnId),
    version ? apiConnector.fetchLines(returnId, version.version_id) : []
  ])
  return { version, versions, lines }
}

const getReturnData = async (returnId, versionNumber) => {
  // Irrespective of whether service/NALD data, the return header is always loaded
  // from the returns service
  const ret = await apiConnector.fetchReturn(returnId)

  const data = await getServiceData(returnId, versionNumber)

  return {
    ...data,
    return: ret
  }
}

module.exports = {
  getReturnData
}
