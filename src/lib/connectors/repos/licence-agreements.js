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
  const licenceAgreements = await LicenceAgreement
    .forge()
    .query('where', 'licence_ref', licenceRef)
    .query('whereIn', 'financial_agreement_type_id', agreementTypes)
    .orderBy('start_date', 'asc')
    .fetchAll();
  return licenceAgreements.toJSON();
};

exports.findByLicenceRef = findByLicenceRef;
