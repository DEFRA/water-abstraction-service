const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const uuid = require('uuid/v4')

const billingInvoiceLicences = require('../../../../src/lib/connectors/repos/billing-invoice-licences')
const { bookshelf } = require('../../../../src/lib/connectors/bookshelf')
const raw = require('../../../../src/lib/connectors/repos/lib/raw')
const paginationHelper = require('../../../../src/lib/connectors/repos/lib/envelope')
const queries = require('../../../../src/lib/connectors/repos/queries/billing-invoice-licences')
const billingInvoiceLicence = require('../../../../src/lib/connectors/bookshelf/BillingInvoiceLicence')

experiment('lib/connectors/repos/billing-invoice-licences', () => {
  let bookshelfStub, model

  beforeEach(async () => {
    sandbox.stub(bookshelf.knex, 'raw')
    sandbox.stub(raw, 'singleRow')
    sandbox.stub(paginationHelper, 'paginatedEnvelope')

    model = {
      toJSON: sandbox.stub()
    }

    bookshelfStub = {
      where: sandbox.stub().returnsThis(),
      orderBy: sandbox.stub().returnsThis(),
      fetch: sandbox.stub().resolves(model),
      fetchPage: sandbox.stub().resolves(model),
      query: sandbox.stub().returnsThis(),
      destroy: sandbox.stub(),
      count: sandbox.stub()
    }
    sandbox.stub(billingInvoiceLicence, 'forge').returns(bookshelfStub)
    sandbox.stub(billingInvoiceLicence, 'collection').returns(bookshelfStub)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.upsert', () => {
    const data = {
      billingInvoiceId: '7d702412-46a4-4a88-bb59-cd770d3eaa3f',
      companyId: 'cfe824a3-2a5e-457e-82ae-bd4bcc43dbe3',
      addressId: 'f3597ab0-3e6f-4564-82a7-939aa2a7e5d6',
      licenceRef: '01/123/ABC'
    }

    beforeEach(async () => {
      await billingInvoiceLicences.upsert(data)
    })

    test('calls raw.singleRow with correct argumements', async () => {
      const { args } = raw.singleRow.lastCall
      expect(args[0]).to.equal(queries.upsert)
      expect(args[1]).to.equal(data)
    })
  })

  experiment('.deleteEmptyByBatchId', () => {
    const batchId = '23181afd-25aa-4a8e-9342-7734dd844f7b'

    beforeEach(async () => {
      await billingInvoiceLicences.deleteEmptyByBatchId(batchId)
    })

    test('calls bookshelf.knex.raw with correct params', async () => {
      const { args } = bookshelf.knex.raw.lastCall
      expect(args[0]).to.equal(queries.deleteEmptyByBatchId)
      expect(args[1]).to.equal({ batchId })
    })
  })

  experiment('.findOneInvoiceLicenceWithTransactions', () => {
    let result
    beforeEach(async () => {
      model.toJSON.returns({ foo: 'bar' })
      result = await billingInvoiceLicences.findOneInvoiceLicenceWithTransactions('00000000-0000-0000-0000-000000000000')
    })

    test('calls forge with correct argumements', async () => {
      const { args } = billingInvoiceLicence.forge.lastCall
      expect(args[0]).to.equal({ billingInvoiceLicenceId: '00000000-0000-0000-0000-000000000000' })
    })
    test('calls forge().fetch with correct arguments', async () => {
      const { args } = billingInvoiceLicence.forge().fetch.lastCall
      expect(args[0].withRelated[0]).to.equal('licence')
      expect(args[0].withRelated[1]).to.equal('licence.region')
      expect(args[0].withRelated[2]).to.equal('billingTransactions')
      expect(args[0].withRelated[3]).to.equal('billingTransactions.billingVolume')
      expect(args[0].withRelated[4]).to.equal('billingTransactions.chargeElement')
      expect(args[0].withRelated[5]).to.equal('billingTransactions.chargeElement.purposeUse')
    })

    test('returns the result of the toJSON() call', async () => {
      expect(result).to.equal({ foo: 'bar' })
    })
  })

  experiment('.findOne', () => {
    let result
    const billingInvoiceLicenceId = uuid()
    experiment('when the model is not found', () => {
      beforeEach(async () => {
        bookshelfStub.fetch.resolves(null)
        result = await billingInvoiceLicences.findOne(billingInvoiceLicenceId)
      })

      test('the model is forged with correct params', async () => {
        expect(billingInvoiceLicence.forge.calledWith({
          billingInvoiceLicenceId
        })).to.be.true()
      })

      test('fetch is called on the model with related models', async () => {
        expect(bookshelfStub.fetch.calledWith({
          withRelated: [
            'billingInvoice',
            'billingInvoice.billingBatch',
            'billingInvoice.billingBatch.region'
          ]
        })).to.be.true()
      })

      test('resolves with null', async () => {
        expect(result).to.be.null()
      })
    })

    experiment('when the model is found', () => {
      beforeEach(async () => {
        model.toJSON.returns({ billingInvoiceLicenceId })
        result = await billingInvoiceLicences.findOne(billingInvoiceLicenceId)
      })

      test('model.toJSON() is called on the model', async () => {
        expect(model.toJSON.called).to.be.true()
      })

      test('resolves with the result of the toJSON() call', async () => {
        expect(result).to.equal({ billingInvoiceLicenceId })
      })
    })
  })

  experiment('.findAll', () => {
    const billingInvoiceLicenceId = uuid()

    beforeEach(async () => {
      await billingInvoiceLicences.findAll(billingInvoiceLicenceId, 1, 10)
    })

    test('the model is forged', async () => {
      expect(billingInvoiceLicence.forge.called).to.be.true()
    })

    test('calls query with a function', async () => {
      const [func] = billingInvoiceLicence.forge().query.lastCall.args
      expect(func).to.be.a.function()
    })

    test('calls forge().fetchPage with correct arguments', async () => {
      const [{ pageSize, page, withRelated }] = billingInvoiceLicence.forge().fetchPage.lastCall.args
      expect(pageSize).to.equal(10)
      expect(page).to.equal(1)
      expect(withRelated).to.equal([
        'billingInvoice',
        'billingInvoice.billingBatch',
        'billingInvoice.billingBatch.region'
      ])
    })
  })

  experiment('.delete', () => {
    const billingInvoiceLicenceId = uuid()

    beforeEach(async () => {
      await billingInvoiceLicences.delete(billingInvoiceLicenceId)
    })

    test('the model is forged with correct params', async () => {
      expect(billingInvoiceLicence.forge.calledWith({
        billingInvoiceLicenceId
      })).to.be.true()
    })

    test('the model is destroyed', async () => {
      expect(bookshelfStub.destroy.called).to.be.true()
    })
  })

  experiment('.deleteByBatchId', () => {
    const batchId = uuid()

    beforeEach(async () => {
      await billingInvoiceLicences.deleteByBatchId(batchId)
    })

    test('calls knex.raw() with correct argumements', async () => {
      const [query, params] = bookshelf.knex.raw.lastCall.args
      expect(query).to.equal(queries.deleteByBatchId)
      expect(params).to.equal({ batchId })
    })
  })

  experiment('.deleteByInvoiceId', () => {
    const billingInvoiceId = uuid()

    beforeEach(async () => {
      await billingInvoiceLicences.deleteByInvoiceId(billingInvoiceId)
    })

    test('the model is forged', async () => {
      expect(billingInvoiceLicence.forge.called).to.be.true()
    })

    test('the correct invoice licences are selected for deletion', async () => {
      expect(bookshelfStub.where.calledWith({
        billing_invoice_id: billingInvoiceId
      })).to.be.true()
    })

    test('the models are destroyed', async () => {
      expect(bookshelfStub.destroy.called).to.be.true()
    })
  })

  experiment('.findCountByInvoiceId', () => {
    const billingInvoiceId = uuid()

    beforeEach(async () => {
      await billingInvoiceLicences.findCountByInvoiceId(billingInvoiceId)
    })

    test('the model is forged', async () => {
      expect(billingInvoiceLicence.forge.called).to.be.true()
    })

    test('selects the correct invoice licences', async () => {
      expect(bookshelfStub.where.calledWith({
        billing_invoice_id: billingInvoiceId
      })).to.be.true()
    })

    test('calls count()', async () => {
      expect(bookshelfStub.count.called).to.be.true()
    })
  })
})
