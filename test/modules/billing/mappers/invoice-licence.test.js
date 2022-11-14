'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const { v4: uuid } = require('uuid')
const sandbox = require('sinon').createSandbox()

const invoiceLicenceMapper = require('../../../../src/modules/billing/mappers/invoice-licence')
const transactionMapper = require('../../../../src/modules/billing/mappers/transaction')

const InvoiceLicence = require('../../../../src/lib/models/invoice-licence')
const Licence = require('../../../../src/lib/models/licence')
const Transaction = require('../../../../src/lib/models/transaction')

const createLicence = () => ({
  licenceId: 'd563b2b9-e87e-4a9c-8990-1acc96fe2c17',
  licenceRef: '01/123',
  region: {
    regionId: '80bb8d61-786c-4b86-9bb4-8959fa6a2d20',
    name: 'Anglian',
    displayName: 'Anglian',
    chargeRegionId: 'A'
  },
  regions: { historicalAreaCode: 'ARCA', regionalChargeArea: 'Anglian' },
  startDate: '2020-01-01',
  expiredDate: null,
  lapsedDate: null,
  revokedDate: null
})

experiment('modules/billing/mappers/invoice-licence', () => {
  beforeEach(async () => {
    sandbox.stub(transactionMapper, 'dbToModel').returns(new Transaction())
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.dbToModel', () => {
    let result

    const dbRow = {
      billingInvoiceLicenceId: '4e44ea0b-62fc-4a3d-82ed-6ff563f1e39b',
      licence: createLicence(),
      billingInvoiceId: 'cf796261-fc3a-4203-86fd-a4b39e9f3f88'
    }

    beforeEach(async () => {
      result = invoiceLicenceMapper.dbToModel(dbRow)
    })

    test('returns an instance of InvoiceLicence with correct ID', async () => {
      expect(result instanceof InvoiceLicence).to.be.true()
      expect(result.id).to.equal(dbRow.billingInvoiceLicenceId)
    })

    test('the invoiceLicence has a Licence', async () => {
      expect(result.licence instanceof Licence).to.be.true()
    })

    test('the invoiceId is set', async () => {
      expect(result.invoiceId).to.equal(dbRow.billingInvoiceId)
    })

    experiment('when there are billingTransactions', () => {
      let dbRow

      beforeEach(async () => {
        dbRow = {
          billingInvoiceLicenceId: '4e44ea0b-62fc-4a3d-82ed-6ff563f1e39b',
          licence: createLicence(),
          billingTransactions: [{
            billingTransactionId: uuid()
          }, {
            billingTransactionId: uuid()
          }],
          billingInvoiceId: 'cf796261-fc3a-4203-86fd-a4b39e9f3f88'
        }
        result = invoiceLicenceMapper.dbToModel(dbRow)
      })

      test('the transaction mapper .dbToModel is called for each billingTransaction', async () => {
        expect(transactionMapper.dbToModel.callCount).to.equal(2)
        expect(transactionMapper.dbToModel.calledWith(dbRow.billingTransactions[0])).to.be.true()
        expect(transactionMapper.dbToModel.calledWith(dbRow.billingTransactions[1])).to.be.true()
      })

      test('the transactions property contains an array of Transaction instances', async () => {
        expect(result.transactions).to.be.an.array().length(2)
        expect(result.transactions[0] instanceof Transaction).to.be.true()
        expect(result.transactions[1] instanceof Transaction).to.be.true()
      })
    })
  })
})
