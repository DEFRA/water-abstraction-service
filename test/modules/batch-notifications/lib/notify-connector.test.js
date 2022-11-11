'use strict'

const { expect } = require('@hapi/code')
const {
  experiment, test, beforeEach, afterEach
} = exports.lab = require('@hapi/lab').script()
const sandbox = require('sinon').createSandbox()

const { v4: uuid } = require('uuid')

const notifyConnector =
  require('../../../../src/modules/batch-notifications/lib/notify-connector')

const s3Connector = require('../../../../src/lib/services/s3')
const pdfCreator = require('../../../../src/lib/services/pdf-generation/pdf')

const ScheduledNotification = require('../../../../src/lib/models/scheduled-notification')

const messageId = uuid()

const createScheduledNotification = (overrides = {}) => {
  return new ScheduledNotification().fromHash({
    id: messageId,
    messageType: 'letter',
    recipient: 'mail@example.com',
    messageRef: 'returns_invitation_letter',
    personalisation: {
      address_line_1: 'address',
      address_line_5: 'postcode'
    }
  })
}

experiment('batch notifications notify connector', () => {
  let client, sendLetter, sendPrecompiledLetter, sendEmail, message

  const testPdf = Buffer.from('test-pdf', 'utf-8')
  const notifyResponse = {
    body: {
      id: 'notify-id'
    }
  }

  beforeEach(async () => {
    message = createScheduledNotification()

    sandbox.stub(s3Connector, 'upload').resolves()
    sandbox.stub(pdfCreator, 'createPdfFromScheduledNotification').resolves(testPdf)
    sendPrecompiledLetter = sandbox.stub().resolves(notifyResponse)
    sendLetter = sandbox.stub().resolves(notifyResponse)
    sendEmail = sandbox.stub().resolves(notifyResponse)

    client = {
      sendEmail,
      sendLetter,
      sendPrecompiledLetter
    }
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('createNotifyReference', () => {
    test('creates a reference to identify PDF messages in Notify', async () => {
      const result = notifyConnector._createNotifyReference(message)
      expect(result).to.equal(`address ${messageId}`)
    })
  })

  experiment('getNotifyTemplate', () => {
    test('gets the notify template to use for returns invitation', async () => {
      const result = notifyConnector._getNotifyTemplate(message)
      expect(result).to.equal('d31d05d3-66fe-4203-8626-22e63f9bccd6')
    })
  })

  experiment('uploadPDFtoS3', () => {
    test('generates a filename for the S3 bucket', async () => {
      await notifyConnector._uploadPDFToS3(message)
      const [filename] = s3Connector.upload.lastCall.args
      expect(filename).to.equal(`pdf-letters/${message.id}.pdf`)
    })

    test('provides the PDF data to the S3 uploader', async () => {
      await notifyConnector._uploadPDFToS3(message, testPdf)
      const [, pdf] = s3Connector.upload.lastCall.args
      expect(pdf).to.equal(testPdf)
    })
  })

  experiment('sendPDF', () => {
    test('calls createPdf with the message ID', async () => {
      await notifyConnector._sendPDF(client, message)
      const [notification] = pdfCreator.createPdfFromScheduledNotification.lastCall.args
      expect(notification).to.equal(message)
    })

    test('uploads PDF to S3', async () => {
      await notifyConnector._sendPDF(client, message)
      const [fileName, pdf] = s3Connector.upload.lastCall.args
      expect(fileName).to.equal(`pdf-letters/${message.id}.pdf`)
      expect(pdf).to.equal(testPdf)
    })

    test('sends PDF as letter via Notify', async () => {
      await notifyConnector._sendPDF(client, message)
      expect(client.sendPrecompiledLetter.callCount).to.equal(1)
      const [notifyReference, pdf] = client.sendPrecompiledLetter.lastCall.args
      expect(notifyReference).to.be.a.string()
      expect(pdf).to.equal(testPdf)
    })

    test('resolves with Notify response', async () => {
      const result = await notifyConnector._sendPDF(client, message)
      expect(result).to.equal(notifyResponse)
    })
  })

  experiment('sendLetter', () => {
    test('sends letter using Notify client', async () => {
      await notifyConnector._sendLetter(client, message)
      expect(client.sendLetter.callCount).to.equal(1)
      const [templateId, options] = client.sendLetter.lastCall.args
      expect(templateId).to.equal('d31d05d3-66fe-4203-8626-22e63f9bccd6')
      expect(options).to.equal({
        personalisation: message.personalisation
      })
    })

    test('resolves with Notify response', async () => {
      const result = await notifyConnector._sendLetter(client, message)
      expect(result).to.equal(notifyResponse)
    })
  })

  experiment('sendEmail', () => {
    test('sends email using Notify client', async () => {
      await notifyConnector._sendEmail(client, message)
      expect(client.sendEmail.callCount).to.equal(1)
      const [templateId, recipient, options] = client.sendEmail.lastCall.args
      expect(templateId).to.equal('d31d05d3-66fe-4203-8626-22e63f9bccd6')
      expect(recipient).to.equal('mail@example.com')
      expect(options).to.equal({
        personalisation: message.personalisation
      })
    })

    test('resolves with Notify response', async () => {
      const result = await notifyConnector._sendEmail(client, message)
      expect(result).to.equal(notifyResponse)
    })
  })

  experiment('getAction', () => {
    test('for PDF message reference, send a PDF', async () => {
      message.messageType = 'letter'
      message.messageRef = 'pdf.test'
      const result = notifyConnector._getAction(message)
      expect(result).to.equal('pdf')
    })
    test('for letter without a PDF message reference, send a letter', async () => {
      message.messageType = 'letter'
      message.messageRef = 'test'
      const result = notifyConnector._getAction(message)
      expect(result).to.equal('letter')
    })
    test('for email message, send an email', async () => {
      message.messageType = 'email'
      message.messageRef = 'test'
      const result = notifyConnector._getAction(message)
      expect(result).to.equal('email')
    })
  })
})
