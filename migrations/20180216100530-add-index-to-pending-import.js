'use strict'


/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, _seedLink) {
}

exports.up = function (db) {
  return null
}

exports.down = function (db) {
  return null
}

exports._meta = {
  version: 1
}
