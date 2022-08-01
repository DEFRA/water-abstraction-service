'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('ReturnRequirement', {

  tableName: 'water.return_requirements',

  idAttribute: 'return_requirement_id',

  hasTimestamps: ['date_created', 'date_updated'],

  returnRequirementPurposes () {
    return this.hasMany('ReturnRequirementPurpose', 'return_requirement_id', 'return_requirement_id')
  }
})
