'use strict'

// Test framework dependencies
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

// Test helpers
const { v4: uuid } = require('uuid')
const invoiceAccountsConnector = require('../../../../src/lib/connectors/crm-v2/invoice-accounts')
const { logger } = require('../../../../src/logger')
const notifyService = require('../../../../src/lib/notify')

// Thing under test
const checkForUpdatedInvoiceAccountsJob = require('../../../../src/modules/billing/jobs/check-for-updated-invoice-accounts')

experiment('modules/billing/jobs/check-for-updated-invoice-accounts', () => {
  const job = {
    id: uuid(),
    name: checkForUpdatedInvoiceAccountsJob.jobName,
    data: {}
  }
  const invoiceAccountsReturned = [{
    invoiceAccountId: uuid()
  }]

  beforeEach(async () => {
    // We stub the logger just to silence it's output during the tests
    sandbox.stub(logger, 'info')

    sandbox.stub(notifyService, 'sendEmail')
    sandbox.stub(invoiceAccountsConnector, 'fetchInvoiceAccountsWithUpdatedEntities').resolves(invoiceAccountsReturned)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('exports the expected job name', async () => {
    expect(checkForUpdatedInvoiceAccountsJob.jobName).to.equal('billing.find-update-invoice-accounts')
  })

  experiment('.createMessage', () => {
    test('creates the expected message array', async () => {
      const message = checkForUpdatedInvoiceAccountsJob.createMessage()
      expect(message).to.equal([
        'billing.find-update-invoice-accounts',
        {},
        {
          repeat: {
            cron: '0 */12 * * *'
          }
        }
      ])
    })
  })

  experiment('.handler', () => {
    test('Calls the CRM to fetch relevant invoice accounts', async () => {
      await checkForUpdatedInvoiceAccountsJob.handler(job)

      expect(invoiceAccountsConnector.fetchInvoiceAccountsWithUpdatedEntities.called).to.be.true()
    })

    test('Calls the notify web service', async () => {
      await checkForUpdatedInvoiceAccountsJob.handler(job)

      expect(notifyService.sendEmail.called).to.be.true()
    })
  })

  experiment('.onFailed', () => {
    const err = new Error('something went wrong')

    beforeEach(async () => {
      sandbox.stub(logger, 'error')
    })

    test('logs the reason for failure', async () => {
      await checkForUpdatedInvoiceAccountsJob.onFailed(job, err)

      expect(logger.error.calledWith(
        `Job ${job.name} ${job.id} failed`,
        err.stack
      )).to.be.true()
    })
  })
})
