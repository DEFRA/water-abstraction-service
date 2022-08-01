'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const uuid = require('uuid/v4')
const sandbox = require('sinon').createSandbox()

const approveBatchJob = require('../../../../src/modules/billing/jobs/approve-batch')
const batchService = require('../../../../src/modules/billing/services/batch-service')
const refreshTotalsJob = require('../../../../src/modules/billing/jobs/refresh-totals')
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job')
const Batch = require('../../../../src/lib/models/batch')
const { logger } = require('../../../../src/logger')

const BATCH_ID = uuid()

experiment('modules/billing/jobs/approve-batch', () => {
  let batch, queueManager
  const user = { id: 19, email: 'test@email.com' }

  beforeEach(async () => {
    sandbox.stub(batchJob, 'logHandling')
    sandbox.stub(batchJob, 'logHandlingError')
    sandbox.stub(batchJob, 'logOnCompleteError')
    sandbox.stub(batchJob, 'logOnComplete')
    sandbox.stub(batchService, 'setErrorStatus')

    queueManager = {
      add: sandbox.stub()
    }

    batch = new Batch().fromHash({
      id: BATCH_ID,
      status: Batch.BATCH_STATUS.processing
    })
    sandbox.stub(batchService, 'getBatchById').resolves(batch)
    sandbox.stub(batchService, 'approveBatch').resolves(batch)

    sandbox.stub(logger, 'error')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.jobName', () => {
    test('is set to the expected value', async () => {
      expect(approveBatchJob.jobName).to.equal('billing.approve-batch')
    })
  })

  experiment('.createMessage', () => {
    let message

    beforeEach(async () => {
      message = approveBatchJob.createMessage(BATCH_ID, user)
    })

    test('creates the expected message array', async () => {
      const [name, data, options] = message
      expect(name).to.equal('billing.approve-batch')
      expect(data).to.equal({ batchId: BATCH_ID, user })

      expect(options.jobId).to.startWith(`billing.approve-batch.${BATCH_ID}`)
    })
  })

  experiment('.handler', () => {
    let job
    beforeEach(async () => {
      job = {
        data: {
          batchId: BATCH_ID,
          user
        }
      }
      await approveBatchJob.handler(job)
    })

    test('logs an info message', async () => {
      expect(batchJob.logHandling.calledWith(job)).to.be.true()
    })

    test('gets the batch data from the batch service', async () => {
      expect(batchService.getBatchById.calledWith(job.data.batchId)).to.be.true()
    })
    test('calls the approveBatch from the batch service', async () => {
      const [batchParam, userParam] = batchService.approveBatch.lastCall.args
      expect(batchParam).to.equal(batch)
      expect(userParam).to.equal(user)
    })
  })
  experiment('.onComplete', () => {
    let job
    beforeEach(async () => {
      job = {
        data: {
          batchId: BATCH_ID,
          user
        }
      }
      await approveBatchJob.onComplete(job, queueManager)
    })

    test('logs an info message', async () => {
      expect(batchJob.logOnComplete.calledWith(job)).to.be.true()
    })

    test('gets the batch data from the batch service', async () => {
      const [job, id] = queueManager.add.lastCall.args
      expect(job).to.equal(refreshTotalsJob.jobName)
      expect(id).to.equal(BATCH_ID)
    })

    experiment('when there is an error', () => {
      let err

      beforeEach(async () => {
        err = new Error('oops')
        queueManager.add.rejects(err)
        await approveBatchJob.onComplete(job, queueManager)
      })

      test('a message is logged', async () => {
        expect(batchJob.logOnCompleteError.calledWith(job, err)).to.be.true()
      })
    })
  })
})
