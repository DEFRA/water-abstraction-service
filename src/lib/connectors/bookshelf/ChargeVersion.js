'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('ChargeVersion', {
  tableName: 'water.charge_versions',

  hasTimestamps: ['date_created', 'date_updated'],

  idAttribute: 'charge_version_id',

  chargeElements () {
    return this.hasMany('ChargeElement', 'charge_version_id', 'charge_version_id')
  },

  licence () {
    return this.belongsTo('Licence', 'licence_ref', 'licence_ref')
  },

  note () {
    return this.hasOne('Note', 'note_id', 'note_id')
  },

  changeReason () {
    return this.hasOne('ChangeReason', 'change_reason_id', 'change_reason_id')
  }
})
