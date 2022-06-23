const { ChargeVersion, bookshelf } = require('../../../lib/connectors/bookshelf')
const queries = require('./queries/charge-versions')

const update = changes =>
  ChargeVersion
    .forge()
    .query(qb => qb.where('is_test', true))
    .save(changes, { method: 'update' })

const tearDown = async () => {
  await bookshelf.knex.raw(queries.deleteChargeVerionWorkflows)
  await bookshelf.knex.raw(queries.deleteChargeElements)
  await bookshelf.knex.raw(queries.deleteChargeVersions)
}

exports.tearDown = tearDown
exports.update = update
