'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('LicenceAgreement', {
  tableName: 'licence_agreements',

  idAttribute: 'licence_agreement_id',

  hasTimestamps: ['date_created', 'date_updated'],

  licence () {
    return this.belongsTo('Licence', 'licence_ref', 'licence_ref');
  }
});
