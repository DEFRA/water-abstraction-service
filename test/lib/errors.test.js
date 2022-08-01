const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const errors = require('../../src/lib/errors')

experiment('lib/errors', () => {
  let err

  experiment('NotFoundError', () => {
    beforeEach(async () => {
      err = new errors.NotFoundError('oops')
    })
    test('has the correct name', async () => {
      expect(err.name).to.equal('NotFoundError')
    })

    test('has the correct message', async () => {
      expect(err.message).to.equal('oops')
    })
  })

  experiment('StateError', () => {
    beforeEach(async () => {
      err = new errors.StateError('oops')
    })
    test('has the correct name', async () => {
      expect(err.name).to.equal('StateError')
    })

    test('has the correct message', async () => {
      expect(err.message).to.equal('oops')
    })
  })

  experiment('DBError', () => {
    beforeEach(async () => {
      err = new errors.DBError('oops')
    })
    test('has the correct name', async () => {
      expect(err.name).to.equal('DBError')
    })

    test('has the correct message', async () => {
      expect(err.message).to.equal('oops')
    })
  })

  experiment('InvalidEntityError', () => {
    beforeEach(async () => {
      err = new errors.InvalidEntityError('oops')
    })
    test('has the correct name', async () => {
      expect(err.name).to.equal('InvalidEntityError')
    })

    test('has the correct message', async () => {
      expect(err.message).to.equal('oops')
    })
  })
})
