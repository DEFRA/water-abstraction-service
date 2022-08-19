'use strict'

// Test framework dependencies
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

// Test helpers
const billingApproveBatch = require('../../../src/modules/billing/jobs/approve-batch')
const validateUploadedReturnsData = require('../../../src/modules/returns/lib/jobs/validate-returns')

// Thing under test
const { JobRegistrationService } = require('../../../src/lib/queue-manager/job-registration-service')

experiment('lib/queue-manager/job-registration-service', () => {
  let queueManager

  beforeEach(() => {
    queueManager = {
      register: sandbox.spy()
    }
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('when go() is called', () => {
    test('it calls register() on the queueManager()', () => {
      JobRegistrationService.go(queueManager)

      expect(queueManager.register.called).to.be.true()
    })

    // We pick the first and last WRLS jobs JobRegistrationService requires and registers (at time of writing) and test
    // they are passed through as arguments
    test('it registers WRLS jobs', () => {
      JobRegistrationService.go(queueManager)

      expect(queueManager.register.calledWith(billingApproveBatch)).to.be.true()
      expect(queueManager.register.calledWith(validateUploadedReturnsData)).to.be.true()
    })
  })
})
