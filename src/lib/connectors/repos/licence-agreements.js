'use strict';

const { LicenceAgreement } = require('../bookshelf');
const helpers = require('./lib/helpers');

/**
 * Gets a list of licence agreements of the given types for the specified
 * licence number
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
    .fetchAll({
      withRelated: [
        'financialAgreementType'
      ]
    });

  return licenceAgreements.toJSON();
};

/**
 * Gets a licence agreement by id
 *
 * @param {String} licenceAgreementId
 */
const findOne = async licenceAgreementId =>
  helpers.findOne(LicenceAgreement, 'licenceAgreementId', licenceAgreementId, ['financialAgreementType', 'licence']);

/**
 *
 * @param {String} id
 * @param {Object} changes
 */
const update = async (id, changes) => {
  await LicenceAgreement.forge({ licence_agreement_id: id }).save(changes);
  const response = await findOne(id);
  return response;
};

/**
 * Deletes a licence agreement by
 * @param {String} licenceAgreementId
 */
const deleteOne = async licenceAgreementId =>
  helpers.deleteOne(LicenceAgreement, 'licenceAgreementId', licenceAgreementId);

/**
 * Create new licence agreement
 * @param {Object} licence agreement data
 * @return {Promise<Object>}
 */
const create = data => helpers.create(LicenceAgreement, data);

exports.findByLicenceRef = findByLicenceRef;
exports.findOne = findOne;
exports.update = update;
exports.deleteOne = deleteOne;
exports.create = create;
