'use strict'

const moment = require('moment')
const uuid = require('uuid/v4')
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const { Batch, FinancialYear, Invoice, InvoiceAccount, Region } =
  require('../../../src/lib/models')

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580'
const TEST_FINANCIAL_YEAR = new FinancialYear(2020)

class TestClass {

}
const TEST_MODEL = new TestClass()

const createInvoice = (accountNumber, financialYearEnding = 2020) => {
  const invoice = new Invoice()
  invoice.invoiceAccount = new InvoiceAccount()
  invoice.invoiceAccount.accountNumber = accountNumber
  invoice.financialYear = new FinancialYear(financialYearEnding)
  return invoice
}

experiment('lib/models/batch', () => {
  let batch

  beforeEach(async () => {
    batch = new Batch()
  })

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      batch.id = TEST_GUID
      expect(batch.id).to.equal(TEST_GUID)
    })

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        batch.id = 'hey'
      }
      expect(func).to.throw()
    })
  })

  experiment('.type', () => {
    test('can be set to "annual"', async () => {
      batch.type = 'annual'
      expect(batch.type).to.equal('annual')
    })

    test('can be set to "supplementary"', async () => {
      batch.type = 'supplementary'
      expect(batch.type).to.equal('supplementary')
    })

    test('can be set to "two_part_tariff"', async () => {
      batch.type = 'two_part_tariff'
      expect(batch.type).to.equal('two_part_tariff')
    })

    test('cannot be set to an invalid type', async () => {
      const func = () => {
        batch.type = 'invalid_type'
      }
      expect(func).to.throw()
    })
  })

  experiment('.isSummer', () => {
    test('can be set to true', async () => {
      batch.isSummer = true
      expect(batch.isSummer).to.equal(true)
    })

    test('can be set to false', async () => {
      batch.isSummer = false
      expect(batch.isSummer).to.equal(false)
    })

    test('cannot be set to an invalid value', async () => {
      const func = () => {
        batch.isSummer = 123
      }
      expect(func).to.throw()
    })
  })

  experiment('.startYear', () => {
    test('can be set to a FinancialYear instance', async () => {
      batch.startYear = TEST_FINANCIAL_YEAR
      expect(batch.startYear.endYear).to.equal(2020)
    })

    test('cannot be set to a different model', async () => {
      const func = () => {
        batch.startYear = TEST_MODEL
      }
      expect(func).to.throw()
    })
  })

  experiment('.endYear', () => {
    test('can be set to a FinancialYear instance', async () => {
      batch.endYear = TEST_FINANCIAL_YEAR
      expect(batch.endYear.endYear).to.equal(2020)
    })

    test('cannot be set to a different model', async () => {
      const func = () => {
        batch.endYear = TEST_MODEL
      }
      expect(func).to.throw()
    })
  })

  experiment('.status', () => {
    test('can be set to "processing"', async () => {
      batch.status = 'processing'
      expect(batch.status).to.equal('processing')
    })

    test('can be set to "ready"', async () => {
      batch.status = 'ready'
      expect(batch.status).to.equal('ready')
    })

    test('can be set to "error"', async () => {
      batch.status = 'error'
      expect(batch.status).to.equal('error')
    })

    test('can be set to "empty"', async () => {
      batch.status = 'empty'
      expect(batch.status).to.equal('empty')
    })

    test('cannot be set to an invalid status', async () => {
      const func = () => {
        batch.status = 'pondering'
      }
      expect(func).to.throw()
    })
  })

  experiment('.addInvoice()', () => {
    let invoice

    beforeEach(async () => {
      invoice = createInvoice('S12345678A')
    })

    test('can add an Invoice', async () => {
      batch.addInvoice(invoice)
      expect(batch.invoices[0].invoiceAccount.accountNumber).to.equal('S12345678A')
    })

    test('cannot add a different model', async () => {
      const func = () => {
        batch.addInvoice(TEST_MODEL)
      }
      expect(func).to.throw()
    })

    test('cannot add an Invoice with the same account number more than once', async () => {
      batch.addInvoice(invoice)
      const func = () => {
        batch.addInvoice(invoice)
      }
      expect(func).to.throw()
    })
  })

  experiment('.addInvoices', () => {
    let invoices

    beforeEach(async () => {
      invoices = [createInvoice('S12345678A'), createInvoice('S87654321A')]
    })

    test('can add an array of invoices', async () => {
      batch.addInvoices(invoices)
      expect(batch.invoices.length).to.equal(2)
    })

    test('throws an error if argument not an array', async () => {
      const func = () => {
        batch.addInvoices('not-an-array')
      }
      expect(func).to.throw()
    })

    test('throws an error if array elements are not Invoice', async () => {
      const func = () => {
        batch.addInvoices([TEST_MODEL])
      }
      expect(func).to.throw()
    })
  })

  experiment('.getInvoiceByAccountNumberAndFinancialYear', () => {
    let invoices

    beforeEach(async () => {
      invoices = [createInvoice('S12345678A', 2019), createInvoice('S87654321A', 2019), createInvoice('S87654321A', 2020)]
      batch.addInvoices(invoices)
    })

    test('gets an invoice when an invoice with the account number and financial year is found', async () => {
      const invoice = batch.getInvoiceByAccountNumberAndFinancialYear('S87654321A', new FinancialYear(2020))
      expect(invoice.invoiceAccount.accountNumber).to.equal('S87654321A')
      expect(invoice.financialYear.yearEnding).to.equal(2020)
    })

    test('returns undefined when an invoice with the account number is not found', async () => {
      const invoice = batch.getInvoiceByAccountNumberAndFinancialYear('NOT_HERE', new FinancialYear(2020))
      expect(invoice).to.equal(undefined)
    })
  })

  experiment('construction', () => {
    test('accepts the id', async () => {
      const id = uuid()
      const batch = new Batch(id)
      expect(batch.id).to.equal(id)
    })

    test('can be instantiated without the id', async () => {
      const batch = new Batch()
      expect(batch).to.exist()
    })

    test('sets the invoices to an empty array', () => {
      const batch = new Batch()
      expect(batch.invoices).to.equal([])
    })
  })

  experiment('.region', () => {
    let batch

    beforeEach(async () => {
      batch = new Batch()
    })

    test('can be set to a Region model', async () => {
      const region = new Region()
      batch.region = region
      expect(batch.region).to.equal(region)
    })

    test('throws an error if set to a class that is not an instance of Region', async () => {
      const func = () => {
        batch.region = TEST_MODEL
      }
      expect(func).to.throw()
    })
  })

  experiment('.dateCreated', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z'
      const batch = new Batch()
      batch.dateCreated = dateString

      expect(batch.dateCreated).to.equal(moment(dateString))
    })

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date()
      const batch = new Batch()
      batch.dateCreated = date

      expect(batch.dateCreated).to.equal(moment(date))
    })

    test('can be set using a moment', async () => {
      const now = moment()

      const batch = new Batch()
      batch.dateCreated = now

      expect(batch.dateCreated).to.equal(now)
    })

    test('throws for an invalid string', async () => {
      const dateString = 'not a date'
      const batch = new Batch()

      expect(() => {
        batch.dateCreated = dateString
      }).to.throw()
    })

    test('throws for a boolean value', async () => {
      const batch = new Batch()

      expect(() => {
        batch.dateCreated = true
      }).to.throw()
    })

    test('allows null', async () => {
      const batch = new Batch()
      batch.dateCreated = null
      expect(batch.dateCreated).to.be.null()
    })
  })

  experiment('.dateUpdated', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z'
      const batch = new Batch()
      batch.dateUpdated = dateString

      expect(batch.dateUpdated).to.equal(moment(dateString))
    })

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date()
      const batch = new Batch()
      batch.dateUpdated = date

      expect(batch.dateUpdated).to.equal(moment(date))
    })

    test('can be set using a moment', async () => {
      const now = moment()

      const batch = new Batch()
      batch.dateUpdated = now

      expect(batch.dateUpdated).to.equal(now)
    })

    test('throws for an invalid string', async () => {
      const dateString = 'not a date'
      const batch = new Batch()

      expect(() => {
        batch.dateUpdated = dateString
      }).to.throw()
    })

    test('throws for a boolean value', async () => {
      const batch = new Batch()

      expect(() => {
        batch.dateUpdated = true
      }).to.throw()
    })

    test('allows null', async () => {
      const batch = new Batch()
      batch.dateUpdated = null
      expect(batch.dateUpdated).to.be.null()
    })
  })

  experiment('.isTwoPartTariff', () => {
    test('returns false if the type is annual', async () => {
      const batch = new Batch().fromHash({ type: Batch.BATCH_TYPE.annual })
      expect(batch.isTwoPartTariff()).to.be.false()
    })

    test('returns false if the type is supplementary', async () => {
      const batch = new Batch().fromHash({ type: Batch.BATCH_TYPE.supplementary })
      expect(batch.isTwoPartTariff()).to.be.false()
    })

    test('returns true if the type is twoPartTariff', async () => {
      const batch = new Batch().fromHash({ type: Batch.BATCH_TYPE.twoPartTariff })
      expect(batch.isTwoPartTariff()).to.be.true()
    })
  })

  experiment('.isSupplementary', () => {
    test('returns true when the batch type is supplementary', async () => {
      const batch = new Batch()
      batch.type = Batch.BATCH_TYPE.supplementary
      expect(batch.isSupplementary()).to.be.true()
    })

    test('returns false when the batch type is two-part-tariff', async () => {
      const batch = new Batch()
      batch.type = Batch.BATCH_TYPE.twoPartTariff
      expect(batch.isSupplementary()).to.be.false()
    })

    test('returns false when the batch type is annual', async () => {
      const batch = new Batch()
      batch.type = Batch.BATCH_TYPE.annual
      expect(batch.isSupplementary()).to.be.false()
    })
  })

  experiment('.externalId', () => {
    test('can be set to guid', async () => {
      const id = uuid()
      const batch = new Batch()
      batch.externalId = id
      expect(batch.externalId).to.equal(id)
    })

    test('cannot be set to a non-guid', async () => {
      const batch = new Batch()
      const func = () => { batch.externalId = 'not-a-proper-guid-here' }
      expect(func).to.throw()
    })
  })

  experiment('.billRunNumber', () => {
    test('can be set to a positive integer', async () => {
      const batch = new Batch()
      batch.billRunNumber = 123
      expect(batch.billRunNumber).to.equal(123)
    })

    test('cannot be set to zero', async () => {
      const batch = new Batch()
      const func = () => { batch.billRunNumber = 0 }
      expect(func).to.throw()
    })

    test('cannot be set to a decimal', async () => {
      const batch = new Batch()
      const func = () => { batch.billRunNumber = 43.55 }
      expect(func).to.throw()
    })

    test('cannot be set to a string', async () => {
      const batch = new Batch()
      const func = () => { batch.billRunNumber = 'hello' }
      expect(func).to.throw()
    })

    test('cannot be set to a negative integer', async () => {
      const batch = new Batch()
      const func = () => { batch.billRunNumber = -45 }
      expect(func).to.throw()
    })

    test('cannot be set to null', async () => {
      const batch = new Batch()
      const func = () => { batch.billRunNumber = null }
      expect(func).to.throw()
    })
  })

  experiment('.errorCode', () => {
    Object.values(Batch.BATCH_ERROR_CODE).forEach(code => {
      test(`can be set to ${code}`, async () => {
        const batch = new Batch()
        batch.errorCode = code

        expect(batch.errorCode).to.equal(code)
      })
    })

    test('can be null', async () => {
      const batch = new Batch()
      batch.errorCode = null
      expect(batch.errorCode).to.equal(null)
    })
    test('cannot be other values', async () => {
      expect(() => {
        const batch = new Batch()
        batch.errorCode = -1
      }).to.throw()
    })
  })

  experiment('.statusIsOneOf', () => {
    test('returns false if status not set', async () => {
      const batch = new Batch()
      expect(batch.statusIsOneOf(Batch.BATCH_STATUS.processing)).to.equal(false)
    })

    test('returns false if no statuses are passed', async () => {
      const batch = new Batch()
      batch.status = Batch.BATCH_STATUS.error
      expect(batch.statusIsOneOf()).to.equal(false)
    })

    test('returns false if the batch status is not in the list', async () => {
      const batch = new Batch()
      batch.status = Batch.BATCH_STATUS.sent

      expect(batch.statusIsOneOf(
        Batch.BATCH_STATUS.processing,
        Batch.BATCH_STATUS.ready,
        Batch.BATCH_STATUS.review
      )).to.equal(false)
    })

    test('returns true if the batch status is in the list', async () => {
      const batch = new Batch()
      batch.status = Batch.BATCH_STATUS.ready

      expect(batch.statusIsOneOf(
        Batch.BATCH_STATUS.processing,
        Batch.BATCH_STATUS.ready,
        Batch.BATCH_STATUS.review
      )).to.equal(true)
    })
  })

  experiment('.canBeDeleted', () => {
    test('returns false if the batch has no status', async () => {
      const batch = new Batch()
      expect(batch.canBeDeleted()).to.equal(false)
    })

    test('returns false if the batch status is processing', async () => {
      const batch = new Batch()
      batch.status = Batch.BATCH_STATUS.processing
      expect(batch.canBeDeleted()).to.equal(false)
    })

    test('returns false if the batch status is sent', async () => {
      const batch = new Batch()
      batch.status = Batch.BATCH_STATUS.sent
      expect(batch.canBeDeleted()).to.equal(false)
    })

    test('returns true if the batch status is error', async () => {
      const batch = new Batch()
      batch.status = Batch.BATCH_STATUS.error
      expect(batch.canBeDeleted()).to.equal(true)
    })

    test('returns true if the batch status is ready', async () => {
      const batch = new Batch()
      batch.status = Batch.BATCH_STATUS.ready
      expect(batch.canBeDeleted()).to.equal(true)
    })

    test('returns true if the batch status is review', async () => {
      const batch = new Batch()
      batch.status = Batch.BATCH_STATUS.review
      expect(batch.canBeDeleted()).to.equal(true)
    })

    test('returns true if the batch status is empty', async () => {
      const batch = new Batch()
      batch.status = Batch.BATCH_STATUS.empty
      expect(batch.canBeDeleted()).to.equal(true)
    })
  })

  experiment('.canDeleteInvoices', () => {
    test('returns false if the batch has no status', async () => {
      const batch = new Batch()
      expect(batch.canDeleteInvoices()).to.equal(false)
    })

    test('returns false if the batch status is error', async () => {
      const batch = new Batch()
      batch.status = Batch.BATCH_STATUS.error
      expect(batch.canDeleteInvoices()).to.equal(false)
    })

    test('returns false if the batch status is processing', async () => {
      const batch = new Batch()
      batch.status = Batch.BATCH_STATUS.processing
      expect(batch.canDeleteInvoices()).to.equal(false)
    })

    test('returns false if the batch status is empty', async () => {
      const batch = new Batch()
      batch.status = Batch.BATCH_STATUS.empty
      expect(batch.canDeleteInvoices()).to.equal(false)
    })

    test('returns false if the batch status is sent', async () => {
      const batch = new Batch()
      batch.status = Batch.BATCH_STATUS.sent
      expect(batch.canDeleteInvoices()).to.equal(false)
    })

    test('returns true if the batch status is ready', async () => {
      const batch = new Batch()
      batch.status = Batch.BATCH_STATUS.ready
      expect(batch.canDeleteInvoices()).to.equal(true)
    })

    test('returns false if the batch status is review', async () => {
      const batch = new Batch()
      batch.status = Batch.BATCH_STATUS.review
      expect(batch.canDeleteInvoices()).to.equal(false)
    })
  })

  experiment('.source', () => {
    Object.values(Batch.BATCH_SOURCE).forEach(source => {
      test(`can be set to ${source}`, async () => {
        const batch = new Batch()
        batch.source = source

        expect(batch.source).to.equal(source)
      })
    })

    test('cannot be null', async () => {
      expect(() => {
        const batch = new Batch()
        batch.source = null
      }).to.throw()
    })

    test('cannot be other values', async () => {
      expect(() => {
        const batch = new Batch()
        batch.source = 'invalid-source'
      }).to.throw()
    })
  })

  experiment('.transactionFileReference', () => {
    test('can be set to any string', async () => {
      const batch = new Batch()
      batch.transactionFileReference = 'croutons'

      expect(batch.transactionFileReference).to.equal('croutons')
    })

    test('can be set to null', async () => {
      const batch = new Batch()
      batch.transactionFileReference = null

      expect(batch.transactionFileReference).to.equal(null)
    })
  })

  experiment('.scheme', () => {
    test('can be set to "sroc"', async () => {
      batch.scheme = 'sroc'
      expect(batch.scheme).to.equal('sroc')
    })
    test('can be set to "alcs"', async () => {
      batch.scheme = 'alcs'
      expect(batch.scheme).to.equal('alcs')
    })

    test('cannot be set to an invalid scheme', async () => {
      const func = () => {
        batch.scheme = 'invalid_scheme'
      }
      expect(func).to.throw()
    })
  })
})
