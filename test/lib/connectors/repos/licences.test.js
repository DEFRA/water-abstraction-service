'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const licenceQueries = require('../../../../src/lib/connectors/repos/queries/licences')
const licencesRepo = require('../../../../src/lib/connectors/repos/licences')
const { Licence, bookshelf } = require('../../../../src/lib/connectors/bookshelf')
const raw = require('../../../../src/lib/connectors/repos/lib/raw')
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers')
const moment = require('moment')
const { v4: uuid } = require('uuid')

experiment('lib/connectors/repos/licences.js', () => {
  let model, stub

  beforeEach(async () => {
    model = {
      toJSON: sandbox.stub().returns({ foo: 'bar' })
    }

    stub = {
      fetch: sandbox.stub().resolves(model),
      where: sandbox.stub().returnsThis(),
      fetchAll: sandbox.stub().resolves({
        toJSON: () => ([
          { foo: 'bar' },
          { foo: 'baz' }
        ])
      }),
      save: sandbox.stub().resolves(model)
    }
    sandbox.stub(Licence, 'forge').returns(stub)
    sandbox.stub(bookshelf.knex, 'raw')
    sandbox.stub(raw, 'multiRow')
    sandbox.stub(helpers, 'findOne')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.findOne', () => {
    let result

    experiment('when a record is found', () => {
      beforeEach(async () => {
        result = await licencesRepo.findOne('test-id')
      })

      test('calls model.forge with correct id', async () => {
        const [params] = Licence.forge.lastCall.args
        expect(params).to.equal({ licenceId: 'test-id' })
      })

      test('calls fetch() with related models', async () => {
        const [params] = stub.fetch.lastCall.args
        expect(params.withRelated).to.equal(['region'])
      })

      test('calls toJSON() on returned models', async () => {
        expect(model.toJSON.callCount).to.equal(1)
      })

      test('returns the result of the toJSON() call', async () => {
        expect(result).to.equal({ foo: 'bar' })
      })
    })

    experiment('when a record is not found', () => {
      beforeEach(async () => {
        stub.fetch.resolves(null)
        result = await licencesRepo.findOne('test-id')
      })

      test('resolves with null', async () => {
        expect(result).to.equal(null)
      })
    })
  })

  experiment('.findOneByLicenceRef', () => {
    beforeEach(async () => {
      await licencesRepo.findOneByLicenceRef('test-ref')
    })

    test('calls findOne helper', async () => {
      expect(helpers.findOne.calledWith(
        Licence, 'licence_ref', 'test-ref', ['region']
      )).to.be.true()
    })
  })

  experiment('.findByLicenceRef', () => {
    let result

    beforeEach(async () => {
      result = await licencesRepo.findByLicenceRef(['test-ref-1', 'test-ref-2'])
    })

    test('calls where with correct ids', async () => {
      expect(stub.where.calledWith(
        'licence_ref', 'in', ['test-ref-1', 'test-ref-2']
      )).to.be.true()
    })

    test('calls fetchAll() with related models', async () => {
      const [params] = stub.fetchAll.lastCall.args
      expect(params.withRelated).to.equal(['region'])
    })

    test('returns the result of the toJSON() call', async () => {
      expect(result).to.equal([
        { foo: 'bar' },
        { foo: 'baz' }
      ])
    })
  })

  experiment('.update', () => {
    const licenceId = 'test-licence-id'
    const changes = {
      testing: true
    }

    beforeEach(async () => {
      await licencesRepo.update(licenceId, changes)
    })

    test('calls model.forge with correct data', async () => {
      const [params] = Licence.forge.lastCall.args
      expect(params).to.equal({ licenceId })
    })

    test('calls .save() on the model using patch mode', async () => {
      expect(stub.save.calledWith(changes, { patch: true })).to.be.true()
    })
  })

  experiment('.updateIncludeLicenceInSupplementaryBilling', () => {
    const licenceId = 'test-licence-id'
    const from = 'from'
    const to = 'to'

    beforeEach(async () => {
      await licencesRepo.updateIncludeLicenceInSupplementaryBilling(licenceId, from, to)
    })

    test('calls model.forge with correct data', async () => {
      const [params] = Licence.forge.lastCall.args
      expect(params).to.equal({
        licenceId,
        includeInSupplementaryBilling: from
      })
    })

    test('passes the expected patch to the save function', async () => {
      const [changes] = stub.save.lastCall.args
      expect(changes).to.equal({ includeInSupplementaryBilling: to })
    })

    test('calls .save() on the model using patch mode', async () => {
      const [, options] = stub.save.lastCall.args
      expect(options.patch).to.equal(true)
    })

    test('calls .save() on the model wihtout requiring any updated rows', async () => {
      const [, options] = stub.save.lastCall.args
      expect(options.require).to.equal(false)
    })
  })

  experiment('.updateIncludeInSupplementaryBillingStatusForBatch', () => {
    beforeEach(async () => {
      await licencesRepo.updateIncludeInSupplementaryBillingStatusForBatch(
        'test-batch-id',
        'from-value',
        'to-value'
      )
    })

    test('uses the expected SQL query', async () => {
      const [query] = bookshelf.knex.raw.lastCall.args
      expect(query).to.equal(licenceQueries.updateIncludeInSupplementaryBillingStatusForBatch)
    })

    test('passes the expected params to the query', async () => {
      const [, params] = bookshelf.knex.raw.lastCall.args
      expect(params).to.equal({
        batchId: 'test-batch-id',
        from: 'from-value',
        to: 'to-value'
      })
    })
  })

  experiment('.updateIncludeInSupplementaryBillingStatusForBatchCreatedDate', () => {
    let batchCreatedDate
    let regionId

    beforeEach(async () => {
      batchCreatedDate = moment()
      regionId = uuid()
      await licencesRepo.updateIncludeInSupplementaryBillingStatusForBatchCreatedDate(
        regionId,
        batchCreatedDate,
        'from-value',
        'to-value'
      )
    })

    test('uses the expected SQL query', async () => {
      const [query] = bookshelf.knex.raw.lastCall.args
      expect(query).to.equal(licenceQueries.updateIncludeInSupplementaryBillingStatusForBatchCreatedDate)
    })

    test('passes the expected params to the query', async () => {
      const [, params] = bookshelf.knex.raw.lastCall.args
      expect(params).to.equal({
        regionId,
        batchCreatedDate: batchCreatedDate.toISOString(),
        from: 'from-value',
        to: 'to-value'
      })
    })
  })

  experiment('.findByBatchIdForTwoPartTariffReview', () => {
    beforeEach(async () => {
      await licencesRepo.findByBatchIdForTwoPartTariffReview('batch-id')
    })

    test('calls raw.multiRow with correct query and params', async () => {
      expect(raw.multiRow.calledWith(
        licenceQueries.findByBatchIdForTwoPartTariffReview, { billingBatchId: 'batch-id' }
      )).to.be.true()
    })
  })
})
