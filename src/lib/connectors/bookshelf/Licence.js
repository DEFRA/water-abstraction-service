'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('Licence', {
  tableName: 'licences',

  hasTimestamps: ['date_created', 'date_updated'],

  region () {
    return this.hasOne('Region', 'region_id', 'region_id');
  },

  licenceAgreements () {
    return this.hasMany('LicenceAgreement', 'licence_ref', 'licence_ref');
  }
});
