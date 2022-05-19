'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('ReturnVersion', {

  tableName: 'water.return_versions',

  idAttribute: 'return_version_id',

  hasTimestamps: ['date_created', 'date_updated'],

  returnRequirements () {
    return this.hasMany('ReturnRequirement', 'return_version_id', 'return_version_id')
  }
})
