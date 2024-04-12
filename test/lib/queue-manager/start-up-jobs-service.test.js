'use strict'

// Test framework dependencies
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

// Thing under test
const { StartUpJobsService } = require('../../../src/lib/queue-manager/start-up-jobs-service')

experiment('lib/queue-manager/start-up-jobs-service', () => {
  let queueManager

  beforeEach(() => {
    queueManager = {
      add: sandbox.spy()
    }
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('when go() is called', () => {
    test('it calls add() on the queueManager()', () => {
      StartUpJobsService.go(queueManager)

      expect(queueManager.add.called).to.be.true()
    })

    // We pick one from each group of WRLS jobs StartUpJobsService requires and adds (at time of writing) and test
    // they are passed through as arguments
    test('it adds WRLS jobs', () => {
      StartUpJobsService.go(queueManager)

      expect(queueManager.add.calledWith('notifications.checkStatus')).to.be.true()
      expect(queueManager.add.calledWith('billing.customer-file-refresh')).to.be.true()
      expect(queueManager.add.calledWith('gauging-stations.copy-licence-gauging-stations-from-digitise')).to.be.true()
    })
  })
})
