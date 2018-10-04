require('dotenv').config();
const Lab = require('lab');
const lab = Lab.script();
const Code = require('code');

const sinon = require('sinon');
const { createPdf } = require('../../../../src/modules/notify/lib/pdf.js');

const scheduledNotification = require('../../../../src/controllers/notifications').repository;

lab.experiment('Test createPdf', () => {
  const notification = {
    id: 123,
    message_ref: 'pdf.test'
  };

  lab.test('It should render and create a PDF as a buffer from a notification ID', async () => {
    sinon.stub(scheduledNotification, 'find').resolves({
      error: null,
      rows: [notification]
    });

    const buff = await createPdf(notification.id);
    Code.expect(buff).to.be.a.buffer();

    scheduledNotification.find.restore();
  });
});

exports.lab = lab;
