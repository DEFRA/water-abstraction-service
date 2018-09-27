const Lab = require('lab');
const lab = Lab.script();
const Code = require('code');

const controller = require('../../../src/modules/pdf-notifications/controller.js');
const scheduledNotification = require('../../../src/controllers/notifications').repository;

const sinon = require('sinon');

lab.experiment('Test getRenderNotification', () => {
  const request = {
    params: {
      notificationId: 'test'
    }
  };

  const h = {
    view: sinon.spy()
  };

  const notification = {
    id: 123,
    message_ref: 'pdf.test'
  };

  lab.test('The handler should throw an error if notification not found', async () => {
    Code.expect(controller.getRenderNotification(request, h)).to.reject();
  });

  lab.test('The handler should render a message if PDF notification found', async () => {
    sinon.stub(scheduledNotification, 'find').resolves({
      error: null,
      rows: [notification]
    });

    await controller.getRenderNotification(request, h);

    Code.expect(h.view.calledWith('pdf-notifications/test', { notification })).to.equal(true);

    scheduledNotification.find.restore();
  });
});

exports.lab = lab;
