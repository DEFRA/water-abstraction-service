const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const errors = require('../../../../src/modules/billing/lib/errors')

experiment('modules/billing/lib/errors', () => {
  let err

  experiment('BatchStatusError', () => {
    beforeEach(async () => {
      err = new errors.BatchStatusError('oops')
    })
    test('has the correct name', async () => {
      expect(err.name).to.equal('BatchStatusError')
    })

    test('has the correct message', async () => {
      expect(err.message).to.equal('oops')
    })
  })

  experiment('TransactionStatusError', () => {
    beforeEach(async () => {
      err = new errors.TransactionStatusError('oops')
    })
    test('has the correct name', async () => {
      expect(err.name).to.equal('TransactionStatusError')
    })

    test('has the correct message', async () => {
      expect(err.message).to.equal('oops')
    })
  })

  experiment('BillingVolumeStatusError', () => {
    beforeEach(async () => {
      err = new errors.BillingVolumeStatusError('oops')
    })
    test('has the correct name', async () => {
      expect(err.name).to.equal('BillingVolumeStatusError')
    })

    test('has the correct message', async () => {
      expect(err.message).to.equal('oops')
    })
  })

  experiment('InvoiceNumberError', () => {
    beforeEach(async () => {
      err = new errors.InvoiceNumberError('oops')
    })
    test('has the correct name', async () => {
      expect(err.name).to.equal('InvoiceNumberError')
    })

    test('has the correct message', async () => {
      expect(err.message).to.equal('oops')
    })
  })
})
