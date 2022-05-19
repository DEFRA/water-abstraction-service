'use strict'

const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const sandbox = require('sinon').createSandbox()
const cron = require('node-cron')
const chargeVersionWorkflowPlugin = require('../../../src/modules/charge-versions/plugin')
const licenceVersions = require('../../../src/lib/connectors/repos/licence-versions')
const createChargeVersionWorkflows = require('../../../src/modules/charge-versions/jobs/create-charge-version-workflows')
const { expect } = require('@hapi/code')
const chargeVersionWorkflowJob = require('../../../src/modules/charge-versions/jobs/create-charge-version-workflows')
experiment('modules/charge-versions/plugin.js', () => {
  let server

  beforeEach(async () => {
    server = {
      queueManager: {
        add: sandbox.stub().resolves(),
        register: sandbox.stub().resolves()
      }
    }
    sandbox.stub(cron, 'schedule')
    sandbox.stub(licenceVersions, 'findIdsByDateNotInChargeVersionWorkflows').returns([{ licenceVersionId: 'test-version-id', licenceId: 'test-licence-id' }])
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('has a plugin name', async () => {
    expect(chargeVersionWorkflowPlugin.plugin.name).to.equal('charge-version-workflow-jobs')
  })

  test('requires hapiBull plugin', async () => {
    expect(chargeVersionWorkflowPlugin.plugin.dependencies).to.equal(['hapiBull'])
  })

  experiment('register', () => {
    experiment('on target environments', () => {
      beforeEach(async () => {
        sandbox.stub(process, 'env').value({
          NODE_ENV: 'test'
        })
        await chargeVersionWorkflowPlugin.plugin.register(server)
      })

      test('adds subscriber for the charge charge version workflow job', async () => {
        const [job] = server.queueManager.register.firstCall.args
        expect(job).to.equal(createChargeVersionWorkflows)
      })

      test('schedules a cron job to run every 6 hours', async () => {
        const [schedule, func] = cron.schedule.firstCall.args
        expect(schedule).to.equal('0 */6 * * *')
        expect(func).to.be.function()
      })
    })
  })

  experiment('publishJobs', () => {
    beforeEach(async () => {
      sandbox.stub(process, 'env').value({
        NODE_ENV: 'test'
      })
      await chargeVersionWorkflowPlugin.publishJobs(server.queueManager)
    })

    test('the right job details are added to the queue manager', async () => {
      const [jobName, licenceVersionId, licenceId] = server.queueManager.add.args[0]
      expect(server.queueManager.add.called).to.be.true()
      expect(jobName).to.equal(chargeVersionWorkflowJob.jobName)
      expect(licenceVersionId).to.equal('test-version-id')
      expect(licenceId).to.equal('test-licence-id')
    })
  })
})
