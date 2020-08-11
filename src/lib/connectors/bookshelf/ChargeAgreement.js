'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('ChargeAgreement', {
  tableName: 'charge_agreements',

  hasTimestamps: ['date_created', 'date_updated'],

  idAttribute: 'charge_agreement_id',

  chargeElement () {
    return this.belongsTo('ChargeElement', 'charge_element_id', 'charge_element_id');
  }
});
