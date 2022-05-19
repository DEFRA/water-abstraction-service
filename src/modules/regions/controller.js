'use strict'

const regionsRepo = require('../../lib/connectors/repos/regions')

const getRegions = async () => {
  return {
    data: await regionsRepo.find()
  }
}

exports.getRegions = getRegions
