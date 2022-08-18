'use strict'

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const { QueueManager } = require('../../../src/lib/queue-manager/queue-manager')
const bull = require('bullmq')
const sandbox = require('sinon').createSandbox()
const EventEmitter = require('events')
const { logger } = require('../../../src/logger')

experiment('lib/queue-manager/queue-manager', () => {
  let queueManager, connection, job, workerStub, queueStub, pipelineStub

  beforeEach(async () => {
    workerStub = {
      on: sandbox.stub(),
      close: sandbox.stub()
    }
    queueStub = {
      add: sandbox.stub()
    }
    pipelineStub = {
      del: sandbox.stub(),
      exec: sandbox.stub()
    }
    connection = {
      scanStream: sandbox.stub(),
      pipeline: () => pipelineStub
    }
    queueManager = new QueueManager(connection)
    sandbox.stub(bull, 'Queue').returns(queueStub)
    sandbox.stub(bull, 'Worker').returns(workerStub)
    sandbox.stub(bull, 'QueueScheduler')
    job = {
      jobName: 'test-job',
      handler: () => {},
      onFailed: () => {},
      createMessage: (...args) => args
    }
    sandbox.stub(logger, 'info').returns()
    sandbox.stub(logger, 'error').returns()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('for a simple job', () => {
    beforeEach(async () => {
      queueManager.register(job)
    })

    test('a new Bull queue is created', async () => {
      expect(bull.Queue.calledWith(
        job.jobName, { connection }
      )).to.be.true()
    })

    test('a scheduler is not created', async () => {
      expect(bull.QueueScheduler.called).to.be.false()
    })

    test('an onComplete handler is registered', async () => {
      expect(workerStub.on.calledWith(
        'completed'
      )).to.be.false()
    })

    test('an on failed handler is registered', async () => {
      expect(workerStub.on.calledWith(
        'failed', job.onFailed
      )).to.be.true()
    })

    test('a job can be added', async () => {
      queueManager.add(job.jobName, 'foo', 'bar')
      expect(queueStub.add.calledWith('foo', 'bar')).to.be.true()
    })
  })

  experiment('for a job requiring a scheduler', () => {
    beforeEach(async () => {
      job.hasScheduler = true
      queueManager.register(job)
    })

    test('a scheduler is created', async () => {
      expect(bull.QueueScheduler.calledWith(
        job.jobName, { connection }
      )).to.be.true()
    })
  })

  experiment('for a job with an onComplete handler', () => {
    beforeEach(async () => {
      job.onComplete = () => 'foo'
      queueManager.register(job)
    })

    test('the onComplete handler is registered', async () => {
      expect(workerStub.on.calledWith(
        'completed'
      )).to.be.true()
    })
  })

  experiment('.deleteKeysByPattern', () => {
    let ev, result
    const pattern = 'foo*'
    const keys = ['foo-bar', 'foo-baz']

    beforeEach(async () => {
      ev = new EventEmitter()
      sandbox.spy(ev, 'on')

      connection.scanStream.returns(ev)
    })

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        const func = () => Promise.all([
          queueManager.deleteKeysByPattern(pattern),
          ev.emit('data', keys),
          ev.emit('end')
        ])

        result = await func()
      })

      test('connection.scanStream is called with the pattern', async () => {
        expect(connection.scanStream.calledWith({
          match: pattern
        })).to.be.true()
      })

      test('each key is deleted', async () => {
        expect(pipelineStub.del.callCount).to.equal(2)
        expect(pipelineStub.del.calledWith(keys[0])).to.be.true()
        expect(pipelineStub.del.calledWith(keys[1])).to.be.true()
      })

      test('exec is called', async () => {
        expect(pipelineStub.exec.callCount).to.equal(1)
      })
    })

    experiment('when there is an error', () => {
      const err = new Error('oops!')

      test('the method rejects', async () => {
        const func = () => Promise.all([
          queueManager.deleteKeysByPattern(pattern),
          ev.emit('error', err)
        ])

        result = await expect(func()).to.reject()
        expect(result).to.equal(err)
      })
    })
  })

  experiment('.stopAllWorkers', () => {
    beforeEach(async () => {
      queueManager.register(job)
    })

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        await queueManager.stopAllWorkers()
      })

      test('calls close() on each worker', async () => {
        expect(workerStub.close.callCount).to.equal(1)
      })

      test('no error is logged', async () => {
        expect(logger.error.called).to.be.false()
      })
    })

    experiment('when is an error', () => {
      const err = new Error('Oops!')

      beforeEach(async () => {
        workerStub.close.rejects(err)
        await queueManager.stopAllWorkers()
      })

      test('calls close() on each worker', async () => {
        expect(workerStub.close.callCount).to.equal(1)
      })

      test('an error is logged', async () => {
        expect(logger.error.calledWith(`Error shutting down worker ${job.jobName}`, err)).to.be.true()
      })
    })
  })
})
