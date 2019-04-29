const { expect } = require('code');
const {
  experiment, test, beforeEach, afterEach
} = exports.lab = require('lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const notifyConnector =
require('../../../../src/modules/batch-notifications/lib/notify-connector');

const s3Connector = require('../../../../src/lib/connectors/s3');
const pdfCreator = require('../../../../src/modules/notify/lib/pdf');

experiment('batch notifications notify connector', () => {
  let client, sendLetter, sendPrecompiledLetter, sendEmail;

  const testPdf = Buffer.from('test-pdf', 'utf-8');
  const notifyResponse = {
    body: {
      id: 'notify-id'
    }
  };

  const message = {
    id: 'message-id',
    message_type: 'letter',
    recipient: 'mail@example.com',
    message_ref: 'returns_invitation_letter',
    personalisation: {
      address_line_1: 'address',
      postcode: 'postcode'
    }
  };

  beforeEach(async () => {
    sandbox.stub(s3Connector, 'upload').resolves();
    sandbox.stub(pdfCreator, 'createPdf').resolves(testPdf);
    sendPrecompiledLetter = sandbox.stub().resolves(notifyResponse);
    sendLetter = sandbox.stub().resolves(notifyResponse);
    sendEmail = sandbox.stub().resolves(notifyResponse);

    client = {
      sendEmail,
      sendLetter,
      sendPrecompiledLetter
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getNotifyKey', () => {
    experiment('in production', () => {
      const env = {
        NODE_ENV: 'production',
        TEST_NOTIFY_KEY: 'test-key',
        LIVE_NOTIFY_KEY: 'live-key'
      };

      test('returns a live key for email messages', async () => {
        expect(notifyConnector._getNotifyKey(env, 'email')).to.equal('live-key');
      });

      test('returns a live key for letter messages', async () => {
        expect(notifyConnector._getNotifyKey(env, 'letter')).to.equal('live-key');
      });
    });

    experiment('in non-production environments', () => {
      const env = {
        NODE_ENV: 'not-production',
        TEST_NOTIFY_KEY: 'test-key',
        LIVE_NOTIFY_KEY: 'live-key'
      };

      test('returns a live key for email messages', async () => {
        expect(notifyConnector._getNotifyKey(env, 'email')).to.equal('live-key');
      });

      test('returns a test key for letter messages', async () => {
        expect(notifyConnector._getNotifyKey(env, 'letter')).to.equal('test-key');
      });
    });
  });

  experiment('createNotifyReference', () => {
    test('creates a reference to identify PDF messages in Notify', async () => {
      const result = notifyConnector._createNotifyReference(message);
      expect(result).to.equal('address postcode message-id');
    });
  });

  experiment('getNotifyTemplate', () => {
    test('gets the notify template to use for returns invitation', async () => {
      const message = {
        message_ref: 'returns_invitation_letter'
      };
      const result = notifyConnector._getNotifyTemplate(message);
      expect(result).to.equal('d31d05d3-66fe-4203-8626-22e63f9bccd6');
    });
  });

  experiment('uploadPDFtoS3', () => {
    const message = {
      id: 'message-1'
    };

    test('generates a filename for the S3 bucket', async () => {
      await notifyConnector._uploadPDFToS3(message);
      const [ filename ] = s3Connector.upload.lastCall.args;
      expect(filename).to.equal('pdf-letters/message-1.pdf');
    });

    test('provides the PDF data to the S3 uploader', async () => {
      await notifyConnector._uploadPDFToS3(message, testPdf);
      const [ , pdf ] = s3Connector.upload.lastCall.args;
      expect(pdf).to.equal(testPdf);
    });
  });

  experiment('sendPDF', () => {
    const message = {
      id: 'message_1'
    };

    test('calls createPdf with the message ID', async () => {
      await notifyConnector._sendPDF(client, message);
      const [ id ] = pdfCreator.createPdf.lastCall.args;
      expect(id).to.equal(message.id);
    });

    test('uploads PDF to S3', async () => {
      await notifyConnector._sendPDF(client, message);
      const [ fileName, pdf ] = s3Connector.upload.lastCall.args;
      expect(fileName).to.equal(`pdf-letters/message_1.pdf`);
      expect(pdf).to.equal(testPdf);
    });

    test('sends PDF as letter via Notify', async () => {
      await notifyConnector._sendPDF(client, message);
      expect(client.sendPrecompiledLetter.callCount).to.equal(1);
      const [ notifyReference, pdf ] = client.sendPrecompiledLetter.lastCall.args;
      expect(notifyReference).to.be.a.string();
      expect(pdf).to.equal(testPdf);
    });

    test('resolves with Notify response', async () => {
      const result = await notifyConnector._sendPDF(client, message);
      expect(result).to.equal(notifyResponse);
    });
  });

  experiment('sendLetter', () => {
    test('sends letter using Notify client', async () => {
      await notifyConnector._sendLetter(client, message);
      expect(client.sendLetter.callCount).to.equal(1);
      const [ templateId, options ] = client.sendLetter.lastCall.args;
      expect(templateId).to.equal('d31d05d3-66fe-4203-8626-22e63f9bccd6');
      expect(options).to.equal({
        personalisation: message.personalisation
      });
    });

    test('resolves with Notify response', async () => {
      const result = await notifyConnector._sendLetter(client, message);
      expect(result).to.equal(notifyResponse);
    });
  });

  experiment('sendEmail', () => {
    test('sends email using Notify client', async () => {
      await notifyConnector._sendEmail(client, message);
      expect(client.sendEmail.callCount).to.equal(1);
      const [ templateId, recipient, options ] = client.sendEmail.lastCall.args;
      expect(templateId).to.equal('d31d05d3-66fe-4203-8626-22e63f9bccd6');
      expect(recipient).to.equal('mail@example.com');
      expect(options).to.equal({
        personalisation: message.personalisation
      });
    });

    test('resolves with Notify response', async () => {
      const result = await notifyConnector._sendEmail(client, message);
      expect(result).to.equal(notifyResponse);
    });
  });

  experiment('getAction', () => {
    test('for PDF message reference, send a PDF', async () => {
      const message = { message_type: 'letter', message_ref: 'pdf.test' };
      const result = notifyConnector._getAction(message);
      expect(result).to.equal('pdf');
    });
    test('for letter without a PDF message reference, send a letter', async () => {
      const message = { message_type: 'letter', message_ref: 'test' };
      const result = notifyConnector._getAction(message);
      expect(result).to.equal('letter');
    });
    test('for email message, send an email', async () => {
      const message = { message_type: 'email', message_ref: 'test' };
      const result = notifyConnector._getAction(message);
      expect(result).to.equal('email');
    });
  });

  // experiment('send', () => {
  //   beforeEach(async () => {
  //
  //   });
  //
  //   test('it selects the correct method in the action object', async () => {
  //     await notifyConnector.send(message);
  //   });
  // });
});
