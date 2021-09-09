'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('LicenceVersionPurposeConditionType', {
  tableName: 'water.licence_version_purpose_condition_types',

  idAttribute: 'licence_version_purpose_condition_type_id',

  hasTimestamps: ['date_created', 'date_updated'],

  licenceVersionPurposeConditions () {
    return this.belongsTo('LicenceVersionPurposeCondition', 'licence_version_purpose_condition_type_id', 'licence_version_purpose_condition_type_id');
  }
});
