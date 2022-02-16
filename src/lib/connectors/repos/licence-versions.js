'use strict';

const LicenceVersion = require('../bookshelf/LicenceVersion');
const queries = require('./queries/licence-versions');
const raw = require('./lib/raw');
const helpers = require('./lib/helpers');
const moment = require('moment');
const { naldSwitchOverDate } = require('../../../../config').billing;

/**
 * Gets a licence version including any licenceVersionPurposes,
 * which will also including the purposeUse
 *
 * @param {String} licenceVersionId
 */
const findOne = async licenceVersionId => {
  const licenceVersion = await LicenceVersion
    .forge({ licenceVersionId })
    .fetch({
      withRelated: [
        'licenceVersionPurposes.purposePrimary',
        'licenceVersionPurposes.purposeSecondary',
        'licenceVersionPurposes.purposeUse'
      ],
      require: false
    });

  return licenceVersion && licenceVersion.toJSON();
};

/**
 * Gets a list of licence versions for the given licence id
 * @param {String} licenceId - licence id
 * @return {Promise<Array>}
 */
const findByLicenceId = async licenceId => {
  const licenceVersions = await LicenceVersion
    .forge()
    .where('licence_id', licenceId)
    .fetchAll();

  return licenceVersions.toJSON();
};

/**
 * Finds licence version id created on or after a timestamp
 * @param {String} dateAndTime timestamp
 */
const findIdsByDateNotInChargeVersionWorkflows = dateAndTime =>
  raw.multiRow(
    queries.getNewLicenceVersionsForChargeVersionWorkflow,
    { dateAndTime: dateAndTime || moment(naldSwitchOverDate).toISOString() }
  );

exports.create = data => helpers.create(LicenceVersion, data);

exports.findIdsByDateNotInChargeVersionWorkflows = findIdsByDateNotInChargeVersionWorkflows;
exports.findByLicenceId = findByLicenceId;
exports.findOne = findOne;
