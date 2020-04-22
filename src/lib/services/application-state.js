const repos = require('../connectors/repos');

/**
 * Get application state data by key
 * @param {String} key
 * @return {Promise<Object|Null>}
 */
const get = async key => {
  const data = await repos.applicationState.findOne(key);
  return data.data || null;
};

/**
 * Save application state data
 * @param {String} key
 * @param {Object} data
 * @return {Promise}
 */
const save = (key, data) =>
  repos.applicationState.create(key, { data });

exports.get = get;
exports.save = save;
