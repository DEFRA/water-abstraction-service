'use strict'

// Test framework dependencies
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

// Test helpers
const uuid = require('uuid/v4')
const licenceVersions = require('../../../../src/lib/connectors/repos/licence-versions')
const { logger } = require('../../../../src/logger')

// Thing under test
const licenceNotInChargeVersionWorkflow = require('../../../../src/modules/charge-versions/jobs/licence-not-in-charge-version-workflow')

experiment('modules/charge-versions/jobs/licence-not-in-charge-version-workflow', () => {
  const job = {
    id: uuid(),
    name: licenceNotInChargeVersionWorkflow.jobName,
    data: {}
  }
  const queryResult = [
    { licenceVersionId: uuid(), licenceId: uuid() },
    { licenceVersionId: uuid(), licenceId: uuid() }
  ]

  beforeEach(async () => {
    // We stub the logger just to silence it's output during the tests
    sandbox.stub(logger, 'info')

    // Used in the handler to get the ID's of the licence Versions not in the charge workflow. We stub it so we can
    // can control what it returns
    sandbox.stub(licenceVersions, 'findIdsByDateNotInChargeVersionWorkflows')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('exports the expected job name', async () => {
    expect(licenceNotInChargeVersionWorkflow.jobName).to.equal('licence-not-in-charge-version-workflow')
  })

  experiment('.createMessage', () => {
    test('creates the expected message array', async () => {
      const message = licenceNotInChargeVersionWorkflow.createMessage()
      expect(message).to.equal([
        'licence-not-in-charge-version-workflow',
        {},
        {
          repeat: {
            cron: '0 */6 * * *'
          }
        }
      ])
    })
  })

  experiment('.handler', () => {
    beforeEach(() => {
      licenceVersions.findIdsByDateNotInChargeVersionWorkflows.resolves(queryResult)
    })

    test('it returns the licence versions not in the workflow', async () => {
      const result = await licenceNotInChargeVersionWorkflow.handler(job)

      expect(result).to.equal(queryResult)
    })
  })

  experiment('.onComplete', () => {
    const queueManager = { add: sandbox.stub() }

    beforeEach(() => {
      job.returnvalue = queryResult
      licenceVersions.findIdsByDateNotInChargeVersionWorkflows.resolves(queryResult)
    })

    test('adds a job for each licence version not in the workflow', async () => {
      await licenceNotInChargeVersionWorkflow.onComplete(job, queueManager)

      expect(queueManager.add.calledTwice).to.be.true()

      queryResult.forEach(result => {
        expect(queueManager.add.calledWith(
          'new-LicenceVersion', result.licenceVersionId, result.licenceId
        )).to.be.true()
      })
    })
  })

  experiment('.onFailed', () => {
    const err = new Error('something went wrong')

    beforeEach(() => {
      sandbox.stub(logger, 'error')
    })

    test('logs the reason for failure', async () => {
      await licenceNotInChargeVersionWorkflow.onFailed(job, err)

      expect(logger.error.calledWith(
        `Job ${job.name} ${job.id} failed`,
        err
      )).to.be.true()
    })
  })
})
