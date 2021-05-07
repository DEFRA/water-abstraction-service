'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('LicenceAgreementPurposeUse', {
  tableName: 'water.licence_agreement_purpose_uses',

  idAttribute: 'licence_agreement_purpose_use_id',

  licenceAgreement () {
    return this.belongsTo('LicenceAgreement', 'licence_agreement_id', 'licence_agreement_id');
  },

  purposeUse () {
    return this.hasOne('PurposeUse', 'purpose_use_id', 'purpose_use_id');
  }
});
