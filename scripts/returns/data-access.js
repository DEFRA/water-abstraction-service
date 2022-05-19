const returnsConnector = require('../../src/lib/connectors/returns')

/**
 * Gets all returns that have the copiedForTesting flag in the metadata.
 *
 * @returns {Promise} Promise that will resolve with any test returns
 */
const getAllTestReturns = () => {
  return returnsConnector.returns.findAll({
    'metadata->>copiedForTesting': 'true'
  })
}

/**
 * Gets all versions for the return id
 *
 * @returns {Promise} Promise that will resolve with any versions
 */
const loadReturnVersions = returnId =>
  returnsConnector.versions.findAll({ return_id: returnId })

/**
 * Deletes all return lines that have the given version ids.
 *
 * @param {Array} asyncversionIds The list of version ids to delete matching lines for
 * @returns {Promise} A promise that will resolve to all deleted line calls
 */
const deleteLines = versionIds => {
  // get all the lines for the version ids
  return returnsConnector.lines.delete({
    version_id: {
      $in: versionIds
    }
  })
}

/**
 * Deletes all return versions that have the given version ids.
 *
 * @param {Array} versionIds The list of version ids to delete
 * @returns {Promise} A promise that will resolve to all deleted version calls
 */
const deleteVersions = versionIds => {
  return returnsConnector.versions.delete({
    version_id: {
      $in: versionIds
    }
  })
}

/**
 * Finds any test returns and deletes them
 *
 * @returns {Promise}
 */
const deleteAllReturns = async () => {
  const allTestReturns = await getAllTestReturns()
  const promises = allTestReturns.map(ret => deleteReturn(ret.return_id))
  return Promise.all(promises)
}

/**
 * Deletes the return, and any child versions and lines
 *
 * @param {string} asyncreturnId The id of the return to delete
 * @returns {Promse} Resolves to contain an object with the deleted return id, and the number of versions and lines that were deleted.
 */
const deleteReturn = async returnId => {
  validateDeletion(returnId)

  const output = { returnId }
  const versions = await loadReturnVersions(returnId)
  const versionIds = versions.map(v => v.version_id)

  if (versionIds.length) {
    const lines = await deleteLines(versionIds)
    const versions = await deleteVersions(versionIds)
    output.lines = (lines || []).length
    output.versions = (versions || []).length
  }

  await returnsConnector.returns.delete({ return_id: returnId })
  return output
}

const loadReturn = returnId => returnsConnector.returns.findOne(returnId)

/**
 * Saves a test return, deleting any existing return with the same
 * return id first.
 *
 * @param {Object} ret The test return to save
 * @returns {Promise} Resolve to the created test return
 */
const saveReturn = async ret => {
  await deleteReturn(ret.return_id)
  ret.metadata = JSON.stringify(ret.metadata)
  return returnsConnector.returns.create(ret)
}

/**
 * Ensures that a return is a test return by checking for the
 * copiedForTesting flag.
 *
 * Will throw if the return is found but not a test return.
 *
 * @param {string} returnId The id of the return to validate
 */
const validateDeletion = async returnId => {
  const { data: ret } = await loadReturn(returnId)

  if (ret !== null && ret.metadata.copiedForTesting !== true) {
    throw new Error('Not a test return, so will not delete')
  }
}

exports.getAllTestReturns = getAllTestReturns
exports.loadReturnVersions = loadReturnVersions
exports.deleteLines = deleteLines
exports.deleteVersions = deleteVersions
exports.deleteAllReturns = deleteAllReturns
exports.deleteReturn = deleteReturn
exports.loadReturn = loadReturn
exports.saveReturn = saveReturn
