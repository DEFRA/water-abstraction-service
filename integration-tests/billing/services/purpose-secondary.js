'use strict';

const chargeElementsData = require('./data/charge-elements');
const purposeSecondaryData = require('./data/purpose-secondary');

const { bookshelf } = require('../../../src/lib/connectors/bookshelf');
const PurposeSecondary = require('../../../src/lib/connectors/bookshelf/PurposeSecondary');

const insertQuery = `insert into water.purposes_secondary (legacy_id, description, date_created)
  values (:legacy_id, :description, now()) on conflict (legacy_id) do nothing;`;

/**
 * Creates a secondary purpose if it does not exist
 * @param {String} code - purpose ID
 * @return {Promise}
 */
const create = code => bookshelf.knex.raw(insertQuery, purposeSecondaryData[code]);

const getByLegacyId = async id => PurposeSecondary.forge({ legacy_id: id }).fetch();

const createAndGetId = async code => {
  await create(code);
  const data = await getByLegacyId(code);
  return data;
};

exports.createAndGetId = createAndGetId;
exports.getByLegacyId = getByLegacyId;
