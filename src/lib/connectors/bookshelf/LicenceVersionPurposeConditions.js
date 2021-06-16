'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('LicenceVersionPurposeConditions', {
  tableName: 'water.licence_version_purpose_conditions',

  idAttribute: 'licence_version_purpose_condition_id',

  hasTimestamps: ['date_created', 'date_updated'],

  licenceVersion () {
    return this.belongsTo('LicenceVersion', 'licence_version_id', 'licence_version_id');
  },

  licenceVersionPurpose () {
    return this.hasOne('LicenceVersionPurpose', 'licence_version_purpose_id', 'licence_version_purpose_id');
  },

  licenceVersionPurposeConditionType () {
    return this.hasOne('LicenceVersionPurposeConditionType', 'licence_version_purpose_condition_type_id', 'licence_version_purpose_condition_type_id');
  }
});
