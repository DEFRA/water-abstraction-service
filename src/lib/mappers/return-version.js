'use strict'

const ReturnVersion = require('../models/return-version')
const returnLineMapper = require('./return-line')

/**
 * Maps a return version from the returns service to a water service model
 * @param {Object} row - from returns service
 * @param {Array} lines
 * @return {ReturnVersion} service model
 */
const returnsServiceToModel = (row, lines) => {
  const version = new ReturnVersion()
  version.fromHash({
    id: row.version_id,
    isNilReturn: row.nil_return,
    isCurrentVersion: row.current
  })
  if (lines) {
    version.returnLines = lines.map(returnLineMapper.returnsServiceToModel)
  }
  return version
}

exports.returnsServiceToModel = returnsServiceToModel
