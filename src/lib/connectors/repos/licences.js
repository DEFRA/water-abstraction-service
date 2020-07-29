'use strict';

const { Licence } = require('../bookshelf');
const raw = require('./lib/raw');
const queries = require('./queries/licences');

/**
 * Gets a list of licence agreements of the given types for the specified
 * licece number
 * @param {String} licenceRef - licence number
 * @param {Array} agreementTypes
 * @return {Promise<Array>}
 */
const findOne = async licenceId => {
  const model = await Licence
    .forge({ licenceId })
    .fetch({
      withRelated: [
        'region'
      ]
    });

  return model ? model.toJSON() : null;
};

/**
 * Gets a list of licences in the supplied billing batch, which have a
 * billing volume for TPT review
 * @param {String} billingBatchId
 * @return {Promise<Array>}
 */
const findByBatchIdForTwoPartTariffReview = billingBatchId =>
  raw.multiRow(queries.findByBatchIdForTwoPartTariffReview, { billingBatchId });

exports.findOne = findOne;
exports.findByBatchIdForTwoPartTariffReview = findByBatchIdForTwoPartTariffReview;
