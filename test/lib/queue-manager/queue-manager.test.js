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
      add: sandbox.stub(),
      close: sandbox.stub()
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

  experiment('.register', () => {
    test('a new Bull queue is created', async () => {
      queueManager.register(job)

      expect(bull.Queue.calledWith(
        job.jobName, { connection }
      )).to.be.true()
    })

    test('a job can be added', async () => {
      queueManager.register(job)

      queueManager.add(job.jobName, 'foo', 'bar')
      expect(queueStub.add.calledWith('foo', 'bar')).to.be.true()
    })

    experiment('for a job that wishes to start clean', () => {
      beforeEach(async () => {
        job.startClean = true
        queueManager.register(job)
      })

      test('the existing queue is deleted', async () => {
        expect(connection.scanStream.calledWith({
          match: '*test-job*'
        })).to.be.true()
      })
    })

    experiment('when we are the foreground (index.js) instance', () => {
      test('a Worker is not instantiated', () => {
        queueManager.register(job)

        expect(bull.Worker.called).to.be.false()
      })

      experiment('for a job requiring a scheduler', () => {
        beforeEach(async () => {
          job.hasScheduler = true
        })

        test('a QueueScheduler is not instantiated', () => {
          queueManager.register(job)

          expect(bull.QueueScheduler.called).to.be.false()
        })
      })
    })

    experiment('when we are the background (index-background.js) instance', () => {
      beforeEach(async () => {
        sandbox.stub(process, 'env').value({ name: 'service-background' })
      })

      test('a Worker is instantiated', () => {
        queueManager.register(job)

        expect(bull.Worker.called).to.be.true()
      })

      test("the Worker's onFailed handler is registered", async () => {
        queueManager.register(job)

        expect(workerStub.on.calledWith(
          'failed', job.onFailed
        )).to.be.true()
      })

      experiment('for a job with an onComplete handler', () => {
        beforeEach(async () => {
          job.onComplete = sandbox.stub()
        })

        test("the Worker's onComplete handler is registered", async () => {
          queueManager.register(job)

          expect(workerStub.on.calledWith('completed')).to.be.true()
        })
      })

      experiment('for a job requiring a scheduler', () => {
        beforeEach(async () => {
          job.hasScheduler = true
        })

        test('a QueueScheduler is instantiated', () => {
          queueManager.register(job)

          expect(bull.QueueScheduler.called).to.be.true()
        })
      })
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

  experiment('.closeAll', () => {
    experiment('when we are the foreground (index.js) instance', () => {
      beforeEach(async () => {
        queueManager.register(job)
      })

      test('does not call close() on a worker', async () => {
        await queueManager.closeAll()

        expect(workerStub.close.callCount).to.equal(0)
      })

      test('does call close() on each queue', async () => {
        await queueManager.closeAll()

        expect(queueStub.close.callCount).to.equal(1)
      })

      experiment('and there is an error', () => {
        const err = new Error('Oops!')

        experiment('whilst closing the queue', () => {
          beforeEach(async () => {
            queueStub.close.rejects(err)
            await queueManager.closeAll()
          })

          test('an error is logged', async () => {
            expect(logger.error.calledWith(`Error closing queue ${job.jobName}`, err)).to.be.true()
          })
        })
      })
    })

    experiment('when we are the background (index-background.js) instance', () => {
      beforeEach(async () => {
        sandbox.stub(process, 'env').value({ name: 'service-background' })
        queueManager.register(job)
      })

      test('does call close() on each worker', async () => {
        await queueManager.closeAll()

        expect(workerStub.close.callCount).to.equal(1)
      })

      test('does call close() on each queue', async () => {
        await queueManager.closeAll()

        expect(queueStub.close.callCount).to.equal(1)
      })

      experiment('and there is an error', () => {
        const err = new Error('Oops!')

        experiment('whilst closing the queue', () => {
          beforeEach(async () => {
            queueStub.close.rejects(err)
          })

          test('an error is logged', async () => {
            await queueManager.closeAll()

            expect(logger.error.calledWith(`Error closing queue ${job.jobName}`, err)).to.be.true()
          })
        })

        experiment('whilst closing the worker', () => {
          beforeEach(async () => {
            workerStub.close.rejects(err)
          })

          test('an error is logged', async () => {
            await queueManager.closeAll()

            expect(logger.error.calledWith(`Error closing worker ${job.jobName}`, err)).to.be.true()
          })
        })
      })
    })
  })
})
