'use strict';

const { Licence } = require('../bookshelf');

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

exports.findOne = findOne;
