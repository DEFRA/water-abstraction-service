const { ChargeVersion } = require('../../../src/lib/connectors/bookshelf');

const update = changes =>
  ChargeVersion
    .forge()
    .query(qb => qb.where('is_test', true))
    .save(changes, { method: 'update' });

exports.update = update;
