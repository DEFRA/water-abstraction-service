'use strict'

const repos = require('../../lib/connectors/repos')
const mapper = require('../../lib/mappers/change-reason')

/**
 * Get all change reasons
 */
const getChangeReasons = async (request, h) => {
  const changeReasons = await repos.changeReasons.find()
  return { data: changeReasons.map(mapper.dbToModel) }
}

exports.getChangeReasons = getChangeReasons
