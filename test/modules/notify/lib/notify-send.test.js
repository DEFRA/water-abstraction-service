const { expect } = require('@hapi/code')
const {
  beforeEach,
  afterEach,
  experiment,
  test,
  fail
} = exports.lab = require('@hapi/lab').script()

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const { logger } = require('../../../../src/logger')
const scheduledNotificationConnector = require('../../../../src/modules/notify/connectors/scheduled-notification')
const notifyTemplateConnector = require('../../../../src/modules/notify/connectors/notify-template')
const helpers = require('../../../../src/modules/notify/lib/helpers')
const notify = require('../../../../src/lib/notify')
const notifySendJob = require('../../../../src/modules/notify/lib/notify-send')

experiment('notify-send', () => {
  const personalisation = { address_line_1: 'ADDRESS-LINE-1', postcode: 'POSTCODE' }
  const messageRef = 'MESSAGE-REF'
  const recipient = 'RECIPIENT'
  const notifyTemplate = 'NOTIFY-TEMPLATE'
  let scheduledNotificationData

  beforeEach(async () => {
    scheduledNotificationData = {
      personalisation, message_ref: messageRef, recipient
    }
    sandbox.stub(logger, 'log').returns()
    sandbox.stub(logger, 'info').returns()
    sandbox.stub(logger, 'error').returns()
    sandbox.stub(scheduledNotificationConnector.scheduledNotification, 'update').resolves()
    sandbox.stub(notifyTemplateConnector, 'findByMessageRef').resolves(notifyTemplate)
    sandbox.stub(helpers, 'parseSentResponse').returns({})
    sandbox.stub(notify, 'sendPdf').resolves({})
    sandbox.stub(notify, 'send').resolves({})
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.createMessage', () => {
    let message

    beforeEach(async () => {
      message = notifySendJob.createMessage({})
    })

    test('creates a message with the expected name', async () => {
      expect(message[0]).to.equal(notifySendJob.jobName)
    })

    test('the message has the expected job data', async () => {
      expect(message[1]).to.equal({})
    })
  })

  experiment('.send', () => {
    test('should fail when status is already sent', async () => {
      sandbox.stub(scheduledNotificationConnector, 'findById').resolves({ ...scheduledNotificationData, status: 'sent' })
      await notifySendJob.send('ID').then(() => {
        fail('Expected test to throw an exception')
      }).catch(({ message }) => {
        expect(message).to.equal('Message ID already sent, aborting')
      })
    })

    test('should fail when status is already sent', async () => {
      sandbox.stub(scheduledNotificationConnector, 'findById').resolves(scheduledNotificationData)
      sandbox.stub(helpers, 'isPdf').throwsException()
      await notifySendJob.send('ID').then(() => {
        fail('Expected test to throw an exception')
      }).catch((error) => {
        expect(error).to.be.an.instanceof(Error)
      })
    })
  })

  experiment('.handler', () => {
    let job

    beforeEach(async () => {
      job = {
        data: { id: 'ID' }
      }

      sandbox.stub(scheduledNotificationConnector, 'findById').resolves(scheduledNotificationData)
    })

    test('when notify.send is called correctly', async () => {
      sandbox.stub(helpers, 'isPdf').returns(false)
      await notifySendJob.handler(job)
      const { args } = notify.send.lastCall
      expect(args).to.equal([
        notifyTemplate,
        personalisation,
        recipient
      ])
    })

    test('when notify.sendPdf is called correctly', async () => {
      sandbox.stub(helpers, 'isPdf').returns(true)
      await notifySendJob.handler(job)
      const { args } = notify.sendPdf.lastCall
      expect(args).to.equal([
        job.data.id,
          `${personalisation.address_line_1} ${personalisation.postcode} ${job.data.id}`
      ])
    })
  })

  experiment('.onFailed', () => {
    test('an error message is logged', async () => {
      const err = new Error('Oh no!')
      await notifySendJob.onFailed({}, err)
      const [msg, error] = logger.error.lastCall.args
      expect(msg).to.equal('notify.send: Job has failed')
      expect(error).to.equal(err)
    })
  })

  experiment('.onComplete', () => {
    test('a completion message is logged', async () => {
      await notifySendJob.onComplete()
      const [msg] = logger.info.lastCall.args
      expect(msg).to.equal('notify.send: Job has completed')
    })
  })
})
