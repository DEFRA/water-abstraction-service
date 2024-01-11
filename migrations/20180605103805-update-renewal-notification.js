'use strict'

const fs = require('fs')
const path = require('path')
let Promise

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, _seedLink) {
  Promise = options.Promise
}

const runQuery = (db, sqlName) => {
  const filePath = path.join(__dirname, 'sqls', sqlName)
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
      if (err) return reject(err)

      resolve(data)
    })
  }).then(function (data) {
    return db.runSql(data)
  })
}

exports.up = function (db) {
  return runQuery(db, '20180605103805-update-renewal-notification-up.sql')
}

exports.down = function (db) {
  return runQuery(db, '20180605103805-update-renewal-notification-down.sql')
}

exports._meta = { version: 1 }
