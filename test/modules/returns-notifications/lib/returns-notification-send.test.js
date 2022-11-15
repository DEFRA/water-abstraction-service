const { expect } = require('@hapi/code')
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const { logger } = require('../../../../src/logger')
const returnsNotificationSendJob = require('../../../../src/modules/returns-notifications/lib/returns-notification-send')
const send = require('../../../../src/modules/returns-notifications/lib/send')
const notify = require('../../../../src/modules/notify')

experiment('returns-notification-send', () => {
  let job

  beforeEach(async () => {
    sandbox.stub(logger, 'info').returns()
    sandbox.stub(logger, 'error').returns()

    job = {
      id: 'ID',
      data: {}
    }
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.createMessage', () => {
    let message

    beforeEach(async () => {
      message = returnsNotificationSendJob.createMessage({})
    })

    test('creates a message with the expected name', async () => {
      expect(message[0]).to.equal(returnsNotificationSendJob.jobName)
    })

    test('the message has the expected job data', async () => {
      expect(message[1]).to.equal({})
    })
  })

  experiment('.handler', () => {
    test('when logging info is called correctly', async () => {
      await returnsNotificationSendJob.handler(job)
      const [msg] = logger.info.lastCall.args
      expect(msg).to.equal(`Handling: returnsNotification.send:${job.id}`)
    })
  })

  experiment('.onFailed', () => {
    test('an error message is logged', async () => {
      const err = new Error('Oh no!')
      await returnsNotificationSendJob.onFailed({}, err)
      const [msg, error] = logger.error.lastCall.args
      expect(msg).to.equal('returnsNotification.send: Job has failed')
      expect(error).to.equal(err.stack)
    })
  })

  experiment('.onComplete', () => {
    test('a completion message is logged', async () => {
      sandbox.stub(send, 'prepareMessageData').resolves({})
      sandbox.stub(notify, 'enqueue').resolves()
      await returnsNotificationSendJob.onComplete(job)
      const [msg] = logger.info.lastCall.args
      expect(msg).to.equal('returnsNotification.send: Job has completed')
    })
  })
})
