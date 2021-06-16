'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('LicenceVersionPurposeConditionTypes', {
  tableName: 'water.licence_version_purpose_condition_types',

  idAttribute: 'licence_version_purpose_condition_type_id',

  hasTimestamps: ['date_created', 'date_updated'],

  licenceVersionPurposeConditionType () {
    return this.belongsTo('LicenceVersionPurposeConditionType', 'licence_version_purpose_condition_type_id', 'licence_version_purpose_condition_type_id');
  }
});
