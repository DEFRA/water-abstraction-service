const Lab = require('lab');
const lab = Lab.script();
const Code = require('code');

const controller = require('../../../src/modules/pdf-notifications/controller.js');
const scheduledNotification = require('../../../src/controllers/notifications').repository;

const sandbox = require('sinon').createSandbox();

lab.experiment('Test getRenderNotification', () => {
  const request = {
    params: {
      notificationId: 'test'
    }
  };

  const h = {
    view: sandbox.spy()
  };

  const notification = {
    id: 123,
    message_ref: 'pdf.test'
  };

  lab.beforeEach(async () => {
    sandbox.stub(scheduledNotification, 'find');
  });

  lab.afterEach(async () => {
    sandbox.restore();
  });

  lab.test('The handler should throw an error if notification not found', async () => {
    scheduledNotification.find.resolves({
      error: null,
      rows: []
    });

    Code.expect(controller.getRenderNotification(request, h)).to.reject();
  });

  lab.test('The handler should render a message if PDF notification found', async () => {
    scheduledNotification.find.resolves({
      error: null,
      rows: [notification]
    });

    const html = await controller.getRenderNotification(request, h);

    Code.expect(html).to.equal('OK');

    scheduledNotification.find.restore();
  });
});

exports.lab = lab;
