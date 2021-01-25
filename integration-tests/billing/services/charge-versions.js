const { ChargeVersion, bookshelf } = require('../../../src/lib/connectors/bookshelf');

const update = changes =>
  ChargeVersion
    .forge()
    .query(qb => qb.where('is_test', true))
    .save(changes, { method: 'update' });

const tearDown = () =>
  bookshelf.knex('water.charge_versions')
    .where('is_test', true)
    .del();

// exports.create = create;
exports.tearDown = tearDown;
exports.update = update;
