const repos = require('../connectors/repos')

/**
 * Get application state data by key
 * @param {String} key
 * @return {Promise<Object>}
 */
const get = async key => {
  return repos.applicationState.findOneByKey(key)
}

/**
 * Save application state data
 * @param {String} key
 * @param {Object} data
 * @return {Promise}
 */
const save = async (key, data) => {
  const existing = await repos.applicationState.findOneByKey(key)

  if (existing) {
    return repos.applicationState.update(existing.applicationStateId, { data })
  }
  return repos.applicationState.create({ key, data })
}

exports.get = get
exports.save = save
