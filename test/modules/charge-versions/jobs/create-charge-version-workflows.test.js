'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()
const uuid = require('uuid/v4')

const chargeVersionWorkflowJob = require('../../../../src/modules/charge-versions/jobs/create-charge-version-workflows')

// Services
const chargeVersionWorkflowService = require('../../../../src/modules/charge-versions/services/charge-version-workflows')
const licences = require('../../../../src/lib/services/licences')

// Models
const ChargeVersionWorkflow = require('../../../../src/lib/models/charge-version-workflow')

const logger = require('../../../../src/logger')

experiment('modules/charge-versions/jobs/create-charge-version-workflows', () => {
  const licenceVersionId = uuid()
  const licenceId = uuid()

  let chargeVersionWorkflow
  const id = uuid()
  beforeEach(async () => {
    sandbox.stub(logger)
    sandbox.stub(licences, 'getLicenceById').resolves({ licenceId: 'test-licence-id' })

    chargeVersionWorkflow = new ChargeVersionWorkflow(id)

    sandbox.stub(chargeVersionWorkflowService, 'create').resolves(chargeVersionWorkflow)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('exports the expected job name', async () => {
    expect(chargeVersionWorkflowJob.jobName).to.equal('new-LicenceVersion')
  })

  experiment('.createMessage', () => {
    test('creates the expected message array', async () => {
      const message = chargeVersionWorkflowJob.createMessage(licenceVersionId, licenceId)
      expect(message).to.equal([
        'new-LicenceVersion',
        { licenceVersionId, licenceId },
        {
          jobId: `new-LicenceVersion.${licenceVersionId}`,
          attempts: 6,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        }
      ])
    })
  })

  experiment('.handler', () => {
    let result, job

    experiment('when there is no error', () => {
      beforeEach(async () => {
        job = {
          data: {
            licenceVersionId: 'test-licence-version-id',
            licenceId: 'test-licence-id'
          }
        }
        result = await chargeVersionWorkflowJob.handler(job)
      })

      test(' is called with the correct batch ID', async () => {
        expect(chargeVersionWorkflowService.create.calledWith(
          { licenceId: 'test-licence-id' }, null, null, 'to_setup', 'test-licence-version-id'
        )).to.be.true()
      })

      test('resolves with batch ID', async () => {
        expect(result.chargeVersionWorkflowId).to.equal(chargeVersionWorkflow.id)
      })
    })

    experiment('when there is an error', () => {
      let error
      const err = new Error('something went wrong')

      beforeEach(async () => {
        job = {
          data: {
            licenceVersionId: 'test-licence-version-id',
            licenceId: 'test-licence-id'
          }
        }
        chargeVersionWorkflowService.create.rejects(err)
        const func = () => chargeVersionWorkflowJob.handler(job)
        error = await expect(func()).to.reject()
      })
      test('re-throws the error', async () => {
        expect(error).to.equal(err)
      })
    })
  })
})
