'use strict'

const Region = require('../bookshelf/Region')

const find = async () => {
  const regions = await Region.fetchAll()
  return regions.toJSON()
}

/**
 * Find single region by ID
 * @param {String} regionId
 * @return {Promise<Object>}
 */
const findOne = async regionId => {
  const model = await Region
    .forge({ regionId })
    .fetch()
  return model.toJSON()
}

exports.find = find
exports.findOne = findOne
