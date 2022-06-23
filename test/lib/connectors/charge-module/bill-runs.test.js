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

const gotCM = require('../../../../src/lib/connectors/charge-module/lib/got-cm')
const billRunsApiConnector = require('../../../../src/lib/connectors/charge-module/bill-runs')

experiment('lib/connectors/charge-module/bill-runs', () => {
  beforeEach(async () => {
    sandbox.stub(gotCM, 'get').resolves()
    sandbox.stub(gotCM, 'post').resolves()
    sandbox.stub(gotCM, 'patch').resolves()
    sandbox.stub(gotCM, 'delete').resolves()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.create', () => {
    beforeEach(async () => {
      await billRunsApiConnector.create('A', 'presroc')
    })

    test('the method is POST', async () => {
      expect(gotCM.post.called).to.be.true()
    })

    test('the correct endpoint is called', async () => {
      const [path] = gotCM.post.lastCall.args
      expect(path).to.equal('v3/wrls/bill-runs')
    })

    test('the region is included in the payload', async () => {
      const [, options] = gotCM.post.lastCall.args
      expect(options).to.equal({ json: { region: 'A', ruleset: 'presroc' } })
    })
  })

  experiment('.addTransaction', () => {
    beforeEach(async () => {
      await billRunsApiConnector.addTransaction('test-id', { foo: 'bar' })
    })

    test('the method is POST', async () => {
      expect(gotCM.post.called).to.be.true()
    })

    test('the correct endpoint is called', async () => {
      const [path] = gotCM.post.lastCall.args
      expect(path).to.equal('v3/wrls/bill-runs/test-id/transactions')
    })

    test('the transaction is included in the option with 0 retries', async () => {
      const [, options] = gotCM.post.lastCall.args
      expect(options).to.equal({ json: { foo: 'bar' }, retries: 0 })
    })
  })

  experiment('.approve', () => {
    beforeEach(async () => {
      await billRunsApiConnector.approve('test-id')
    })

    test('the method is PATCH', async () => {
      expect(gotCM.patch.called).to.be.true()
    })

    test('the correct endpoint is called', async () => {
      const [path] = gotCM.patch.lastCall.args
      expect(path).to.equal('v3/wrls/bill-runs/test-id/approve')
    })
  })

  experiment('.send', () => {
    beforeEach(async () => {
      await billRunsApiConnector.send('test-id')
    })

    test('the method is PATCH', async () => {
      expect(gotCM.patch.called).to.be.true()
    })

    test('the correct endpoint is called', async () => {
      const [path] = gotCM.patch.lastCall.args
      expect(path).to.equal('v3/wrls/bill-runs/test-id/send')
    })
  })

  experiment('.deleteInvoiceFromBillRun', () => {
    beforeEach(async () => {
      await billRunsApiConnector.deleteInvoiceFromBillRun('test-id', 'test-other-id')
    })

    test('the method is DELETE', async () => {
      expect(gotCM.delete.called).to.be.true()
    })

    test('the correct endpoint is called', async () => {
      const [path] = gotCM.delete.lastCall.args
      expect(path).to.equal('v3/wrls/bill-runs/test-id/invoices/test-other-id')
    })
  })

  experiment('.delete', () => {
    beforeEach(async () => {
      await billRunsApiConnector.delete('test-id')
    })

    test('the method is DELETE', async () => {
      expect(gotCM.delete.called).to.be.true()
    })

    test('the correct endpoint is called', async () => {
      const [path] = gotCM.delete.lastCall.args
      expect(path).to.equal('v3/wrls/bill-runs/test-id')
    })
  })

  experiment('.get', () => {
    beforeEach(async () => {
      await billRunsApiConnector.get('test-id')
    })

    test('the method is GET', async () => {
      expect(gotCM.get.called).to.be.true()
    })

    test('the correct endpoint is called', async () => {
      const [path] = gotCM.get.lastCall.args
      expect(path).to.equal('v3/wrls/bill-runs/test-id')
    })
  })

  experiment('.getInvoiceTransactions', () => {
    beforeEach(async () => {
      await billRunsApiConnector.getInvoiceTransactions('test-id', 'test-invoice-id')
    })

    test('the correct endpoint is called', () => {
      const [path] = gotCM.get.lastCall.args
      expect(path).to.equal('v3/wrls/bill-runs/test-id/invoices/test-invoice-id')
    })
  })

  experiment('.deleteLicence', () => {
    beforeEach(async () => {
      await billRunsApiConnector.deleteLicence('test-id', 'test-licence-id')
    })

    test('the correct endpoint is called', async () => {
      const [path] = gotCM.delete.lastCall.args
      expect(path).to.equal('v3/wrls/bill-runs/test-id/licences/test-licence-id')
    })
  })
  experiment('.rebillInvoice', () => {
    const batchId = 'test-batch-id'
    const invoiceId = 'test-invoice-id'

    beforeEach(async () => {
      await billRunsApiConnector.rebillInvoice(batchId, invoiceId)
    })

    test('the correct patch endpoint is called', async () => {
      const [path] = gotCM.patch.lastCall.args
      expect(path).to.equal(`v3/wrls/bill-runs/${batchId}/invoices/${invoiceId}/rebill`)
    })
  })

  experiment('.getStatus', () => {
    const batchId = 'test-batch-id'

    beforeEach(async () => {
      await billRunsApiConnector.getStatus(batchId)
    })

    test('the correct get endpoint is called', async () => {
      const [path] = gotCM.get.lastCall.args
      expect(path).to.equal(`v3/wrls/bill-runs/${batchId}/status`)
    })
  })
})
