const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const { bookshelf } = require('../../../../../src/lib/connectors/bookshelf/')
const raw = require('../../../../../src/lib/connectors/repos/lib/raw')

const sqlQuery = 'select * from ...'
const params = {
  foo: 'bar'
}
const rows = [{
  snake_case: 'value'
}, {
  snake_case: 'another-value'
}]
experiment('lib/connectors/repos/lib/raw', () => {
  beforeEach(async () => {
    sandbox.stub(bookshelf.knex, 'raw').resolves({ rows })
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.multiRow', () => {
    let result

    beforeEach(async () => {
      result = await raw.multiRow(sqlQuery, params)
    })

    test('calls bookshelf.knex.raw with correct params', async () => {
      const { args } = bookshelf.knex.raw.lastCall
      expect(args[0]).to.equal(sqlQuery)
      expect(args[1]).to.equal(params)
    })

    test('row data has keys camel-cased', async () => {
      expect(result).to.equal([{
        snakeCase: 'value'
      }, {
        snakeCase: 'another-value'
      }])
    })
  })

  experiment('.singleRow', () => {
    let result

    experiment('when a row is returned', () => {
      beforeEach(async () => {
        result = await raw.singleRow(sqlQuery, params)
      })

      test('calls bookshelf.knex.raw with correct params', async () => {
        const { args } = bookshelf.knex.raw.lastCall
        expect(args[0]).to.equal(sqlQuery)
        expect(args[1]).to.equal(params)
      })

      test('the first row of data is returned with keys camel-cased', async () => {
        expect(result).to.equal({
          snakeCase: 'value'
        })
      })
    })

    experiment('when no rows are found', () => {
      beforeEach(async () => {
        bookshelf.knex.raw.resolves({ rows: [] })
        result = await raw.singleRow(sqlQuery, params)
      })

      test('returns null', async () => {
        expect(result).to.equal(null)
      })
    })
  })
})
