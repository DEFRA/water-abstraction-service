'use strict';

const data = require('./data');
const { bookshelf } = require('../../../src/lib/connectors/bookshelf');
const PurposeUse = require('../../../src/lib/connectors/bookshelf/PurposeUse');

const insertQuery = `insert into water.purposes_uses (legacy_id, description, loss_factor, is_two_part_tariff, date_created)
  values (:legacy_id, :description, :lossFactor, :isTwoPartTariff, now())on conflict (legacy_id) do nothing;`;

/**
 * Creates a purpose use if it does not exist
 * @param {String} code - purpose ID
 * @return {Promise}
 */
const create = code => {
  return bookshelf.knex.raw(insertQuery, data.purposeUses[code]);
};

const getByLegacyId = id => PurposeUse.forge({ legacy_id: id }).fetch();

const createAndGetId = async code => {
  await create(code);
  return getByLegacyId(code);
};

const tearDown = () => bookshelf.knex.raw('delete from water.purposes_uses');

exports.createAndGetId = createAndGetId;
exports.getByLegacyId = getByLegacyId;
exports.tearDown = tearDown;
