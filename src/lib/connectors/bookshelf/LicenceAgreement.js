'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('LicenceAgreement', {
  tableName: 'water.licence_agreements',

  idAttribute: 'licence_agreement_id',

  hasTimestamps: ['date_created', 'date_updated'],

  licence () {
    return this.belongsTo('Licence', 'licence_ref', 'licence_ref');
  },

  financialAgreementType () {
    return this.hasOne('FinancialAgreementType', 'financial_agreement_type_id', 'financial_agreement_type_id');
  },

  licenceAgreementPurposeUses () {
    return this.hasMany('LicenceAgreementPurposeUse', 'licence_agreement_id', 'licence_agreement_id');
  }
});
