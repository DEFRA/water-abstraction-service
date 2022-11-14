const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')

const sandbox = require('sinon').createSandbox()

const batchMapper = require('../../../../src/modules/billing/mappers/batch')
const transactionMapper = require('../../../../src/modules/billing/mappers/transaction')

const { v4: uuid } = require('uuid')

const Batch = require('../../../../src/lib/models/batch')
const FinancialYear = require('../../../../src/lib/models/financial-year')
const Region = require('../../../../src/lib/models/region')
const Invoice = require('../../../../src/lib/models/invoice')
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence')
const Transaction = require('../../../../src/lib/models/transaction')

const data = {
  batch: {
    scheme: 'alcs',
    billingBatchId: uuid(),
    batchType: 'supplementary',
    isSummer: true,
    status: 'processing',
    dateCreated: '2020-02-18T13:54:25+00:00',
    dateUpdated: '2020-02-18T13:54:25+00:00',
    fromFinancialYearEnding: 2019,
    toFinancialYearEnding: 2020,
    region: {
      regionId: uuid(),
      chargeRegionId: 'A',
      name: 'Anglian',
      displayName: 'Anglian'
    },
    netTotal: null,
    creditNoteCount: 4,
    invoiceCount: 3,
    errorCode: 10,
    invoiceValue: null,
    creditNoteValue: null
  }
}

experiment('modules/billing/mappers/batch', () => {
  let batch

  beforeEach(async () => {
    sandbox.stub(transactionMapper, 'modelToChargeModule').returns({})
    sandbox.stub(transactionMapper, 'modelToChargeModuleSroc').returns({})
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.dbToModel', () => {
    experiment('when the net total is null', () => {
      beforeEach(async () => {
        batch = batchMapper.dbToModel(data.batch)
      })

      test('returns a Batch instance', async () => {
        expect(batch instanceof Batch).to.be.true()
      })

      test('scalar properties are mapped correctly', async () => {
        expect(batch.id).to.equal(data.batch.billingBatchId)
        expect(batch.type).to.equal(data.batch.batchType)
        expect(batch.isSummer).to.equal(data.batch.isSummer)
        expect(batch.status).to.equal(data.batch.status)
        expect(batch.dateCreated.format()).to.equal(data.batch.dateCreated)
        expect(batch.dateUpdated.format()).to.equal(data.batch.dateUpdated)
        expect(batch.scheme).to.equal(data.batch.scheme)
      })

      test('the start year is a FinancialYear instance', async () => {
        expect(batch.startYear instanceof FinancialYear).to.be.true()
        expect(batch.startYear.yearEnding).to.equal(2019)
      })

      test('the end year is a FinancialYear instance', async () => {
        expect(batch.endYear instanceof FinancialYear).to.be.true()
        expect(batch.endYear.yearEnding).to.equal(2020)
      })

      test('the region is a Region instance', async () => {
        expect(batch.region instanceof Region).to.be.true()
      })

      test('externalId is not set', async () => {
        expect(batch.externalId).to.be.undefined()
      })

      test('the netTotal is null', async () => {
        expect(batch.netTotal).to.be.null()
      })

      test('the creditNoteValue is null', async () => {
        expect(batch.creditNoteValue).to.be.null()
      })

      test('the invoiceValue is null', async () => {
        expect(batch.invoiceValue).to.be.null()
      })

      test('sets the errorCode property', async () => {
        expect(batch.errorCode).to.equal(10)
      })
    })

    experiment('when the totals are not null', () => {
      beforeEach(async () => {
        batch = batchMapper.dbToModel({
          ...data.batch,
          netTotal: 2345,
          invoiceValue: 2400,
          creditNoteValue: -55
        })
      })

      test('the netTotal is set', async () => {
        expect(batch.netTotal).to.equal(2345)
      })

      test('the invoiceValue is set', async () => {
        expect(batch.invoiceValue).to.equal(2400)
      })

      test('the creditNoteValue is set', async () => {
        expect(batch.creditNoteValue).to.equal(-55)
      })
      test('the endYear is set', async () => {
        expect(batch.endYear.yearEnding).to.equal(2020)
      })
      test('the startYear is set', async () => {
        expect(batch.startYear.yearEnding).to.equal(2019)
      })
    })

    experiment('when there are billing invoices', () => {
      beforeEach(async () => {
        const withInvoices = {
          ...data.batch,
          billingInvoices: [{
            billingInvoiceId: uuid(),
            invoiceAccountId: uuid(),
            invoiceAccountNumber: 'A12345678A'
          }]
        }

        batch = batchMapper.dbToModel(withInvoices)
      })

      test('the invoices are mapped', async () => {
        expect(batch.invoices[0]).to.be.instanceof(Invoice)
      })
    })
  })

  experiment('.modelToChargeModule alcs', () => {
    let batch, cmTransactions

    beforeEach(async () => {
      batch = new Batch()
      batch.invoices = [new Invoice()]
      batch.invoices[0].invoiceLicences = [new InvoiceLicence()]
      batch.invoices[0].invoiceLicences[0].transactions = [
        new Transaction(),
        new Transaction()
      ]
      batch.scheme = 'alcs'
      cmTransactions = batchMapper.modelToChargeModule(batch)
    })

    test('resolves with an array of each transaction', async () => {
      expect(cmTransactions).to.be.an.array().length(2)
    })

    test('calls transaction mapper for each transaction in batch', async () => {
      expect(transactionMapper.modelToChargeModule.callCount).to.equal(2)
      expect(transactionMapper.modelToChargeModule.calledWith(
        batch,
        batch.invoices[0],
        batch.invoices[0].invoiceLicences[0],
        batch.invoices[0].invoiceLicences[0].transactions[0]
      )).to.be.true()
      expect(transactionMapper.modelToChargeModule.calledWith(
        batch,
        batch.invoices[0],
        batch.invoices[0].invoiceLicences[0],
        batch.invoices[0].invoiceLicences[0].transactions[1]
      )).to.be.true()
    })
  })

  experiment('.modelToChargeModule sroc', () => {
    test('transactionMapper.modelToChargeModuleSroc is called when scheme is sroc', async () => {
      const batch = { scheme: 'sroc' }
      batchMapper.modelToChargeModule(batch)
      const args = transactionMapper.modelToChargeModuleSroc.lastCall.args
      expect(args[0]).to.equal(batch)
      expect(transactionMapper.modelToChargeModuleSroc.calledOnce).to.be.true()
    })
  })
})
