const data = require('./data');
const { bookshelf } = require('../../../src/lib/connectors/bookshelf');

const insertQuery = `
insert into water.purposes_uses (id, description, date_created) VALUES (:id, :description, NOW())
on conflict (id) do nothing
`;

/**
 * Creates a purpose use if it does not exist
 * @param {String} code - purpose ID
 * @return {Promise}
 */
const create = code => bookshelf.knex.raw(insertQuery, data.purposeUses[code]);

/**
 * Creates a purpose for the charge element specified
 * @param {String} key - charge element key
 */
const createForChargeElement = key =>
  create(data.chargeElements[key].purposeTertiary);

exports.createForChargeElement = createForChargeElement;
