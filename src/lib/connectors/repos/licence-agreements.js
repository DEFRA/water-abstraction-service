'use strict';

const { LicenceAgreement } = require('../bookshelf');

/**
 * Gets a list of licence agreements of the given types for the specified
 * licece number
 * @param {String} licenceRef - licence number
 * @param {Array} agreementTypes
 * @return {Promise<Array>}
 */
const findByLicenceRef = async (licenceRef, agreementTypes = []) => {
  let licenceAgreements = LicenceAgreement
    .forge()
    .query('where', 'licence_ref', licenceRef);

  if (agreementTypes.length) {
    licenceAgreements = licenceAgreements
      .query('whereIn', 'financial_agreement_type_id', agreementTypes);
  }

  licenceAgreements = await licenceAgreements
    .orderBy('start_date', 'asc')
    .fetchAll();

  return licenceAgreements.toJSON();
};

/**
 * Gets a licence agreement by id
 *
 * @param {String} licenceAgreementId
 */
const findOne = async licenceAgreementId => {
  const licenceAgreement = await LicenceAgreement
    .forge({ licenceAgreementId })
    .fetch({ require: false });

  return licenceAgreement && licenceAgreement.toJSON();
};

exports.findByLicenceRef = findByLicenceRef;
exports.findOne = findOne;
