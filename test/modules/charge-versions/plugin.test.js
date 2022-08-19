'use strict'

// Test framework dependencies
const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

// Test helpers
const createChargeVersionWorkflows = require('../../../src/modules/charge-versions/jobs/create-charge-version-workflows')
const licenceNotInChargeVersionWorkflow = require('../../../src/modules/charge-versions/jobs/licence-not-in-charge-version-workflow')

// Thing under test
const chargeVersionWorkflowPlugin = require('../../../src/modules/charge-versions/plugin')

experiment('modules/charge-versions/plugin.js', () => {
  let server

  beforeEach(async () => {
    server = {
      queueManager: {
        add: sandbox.stub(),
        register: sandbox.stub().returnsThis(),
        deleteKeysByPattern: sandbox.stub()
      }
    }
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('has a plugin name', () => {
    expect(chargeVersionWorkflowPlugin.plugin.name).to.equal('charge-version-workflow-jobs')
  })

  test('requires hapiBull plugin', () => {
    expect(chargeVersionWorkflowPlugin.plugin.dependencies).to.equal(['hapiBull'])
  })

  experiment('register', () => {
    test('adds subscriber for the licence not in charge version workflow job', async () => {
      await chargeVersionWorkflowPlugin.plugin.register(server)

      expect(server.queueManager.register.calledWith(
        licenceNotInChargeVersionWorkflow
      )).to.be.true()
    })

    test('adds subscriber for the charge version workflow job', async () => {
      await chargeVersionWorkflowPlugin.plugin.register(server)

      expect(server.queueManager.register.calledWith(
        createChargeVersionWorkflows
      )).to.be.true()
    })
  })
})
