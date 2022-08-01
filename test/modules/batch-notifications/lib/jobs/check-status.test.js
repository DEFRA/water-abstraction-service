const { expect } = require('@hapi/code')

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const checkStatus = require('../../../../../src/modules/batch-notifications/lib/jobs/check-status')
const messageHelpers = require('../../../../../src/modules/batch-notifications/lib/message-helpers')
const scheduledNotifications = require('../../../../../src/controllers/notifications')
const notify = require('../../../../../src/lib/notify')
const { logger } = require('../../../../../src/logger')
const queries = require('../../../../../src/modules/batch-notifications/lib/queries')

experiment('checkStatus job', () => {
  const messageId = 'message_1'
  const notifyId = 'notify_id'
  const status = 'testStatus'
  const jobId = 'test-job-id'
  const jobParams = 'test-job-params'

  beforeEach(async () => {
    sandbox.stub(scheduledNotifications.repository, 'update').resolves()
    sandbox.stub(notify, 'getStatus').resolves(status)
    sandbox.stub(logger, 'error').resolves()
    sandbox.stub(logger, 'info').resolves()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('the job name should be notifications.checkStatus', async () => {
    expect(checkStatus.jobName).to.equal('notifications.checkStatus')
  })

  experiment('.createMessage', () => {
    let msg

    beforeEach(async () => {
      msg = checkStatus.createMessage()
    })

    test('creates a msg with the expected name', async () => {
      expect(msg[0]).to.equal('notifications.checkStatus')
    })

    test('the msg has no associated job params', async () => {
      expect(msg[1]).to.equal({})
    })

    test('the msg has a config object calling for repeats', async () => {
      expect(msg[2]).to.equal({
        jobId: 'notifications.checkStatus',
        repeat: {
          every: 15000
        }
      })
    })
  })

  experiment('handleCheckStatus', () => {
    experiment('when there is an error', () => {
      const err = new Error('Oh no!')

      test('Should handle the failure of the query to get send events', async () => {
        sandbox.stub(queries, 'getNotifyStatusChecks').rejects(err)
        await checkStatus.handler({ id: jobId, data: jobParams })
        const [msg, error] = logger.error.lastCall.args
        expect(msg).to.equal(`Error handling: ${jobId}`)
        expect(error).to.equal(err)
      })

      test('Should handle refreshing an event failure correctly', async () => {
        sandbox.stub(queries, 'getNotifyStatusChecks').resolves([{ id: messageId }])
        sandbox.stub(messageHelpers, 'getMessageById').rejects(err)
        await checkStatus.handler({ id: jobId })
        const [msg, error, params] = logger.error.lastCall.args
        expect(msg).to.equal('Error checking notify status')
        expect(error).to.equal(err)
        expect(params).to.equal({ messageId })
      })
    })
  })

  experiment('when there are no errors', () => {
    beforeEach(async () => {
      sandbox.stub(queries, 'getNotifyStatusChecks').resolves([{ id: messageId }])
      sandbox.stub(messageHelpers, 'getMessageById')
        .resolves({ id: messageId, notify_id: notifyId })
      await checkStatus.handler({ id: jobId })
    })

    test('loads the scheduled_notification with the ID in the job data', async () => {
      const { args } = messageHelpers.getMessageById.lastCall
      expect(args).to.equal([messageId])
    })

    test('calls Notify getStatus API with correct Notify message ID', async () => {
      const { args } = notify.getStatus.lastCall
      expect(args).to.equal([notifyId])
    })

    test('updates scheduled_notification with new status and next check times', async () => {
      const [filter, data] = scheduledNotifications.repository.update.lastCall.args
      expect(filter).to.equal({ id: messageId })
      expect(data.next_status_check).to.be.a.string()
      expect(data.status_checks).to.be.a.number()
      expect(data.notify_status).to.equal(status)
    })
  })

  experiment('.onFailed', () => {
    test('an error message is logged', async () => {
      const err = new Error('Oh no!')
      await checkStatus.onFailed({}, err)
      const [msg, error] = logger.error.lastCall.args
      expect(msg).to.equal('notifications.checkStatus: Job has failed')
      expect(error).to.equal(err)
    })
  })

  experiment('.onComplete', () => {
    test('a completion message is logged', async () => {
      await checkStatus.onComplete()
      const [msg] = logger.info.lastCall.args
      expect(msg).to.equal('notifications.checkStatus: Job has completed')
    })
  })
})
