const { expect } = require('code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('../../../src/modules/change-email/controller');
const changeEmailHelpers = require('../../../src/modules/change-email/lib/helpers');
const idm = require('../../../src/lib/connectors/idm');
const crm = require('../../../src/lib/connectors/crm/entities');
const scheduledNotifications = require('../../../src/controllers/notifications');
const { logger } = require('../../../src/logger');
const event = require('../../../src/lib/event');

const request = {
  payload: {
    password: 'test-password',
    verificationId: '1234-asdf-qwert',
    newEmail: 'new-email@domain.com',
    securityCode: '98765',
    entityId: '957u-037m-jkd7'
  },
  defra: {
    userId: '1234',
    userName: 'test-user'
  }
};

const h = {};

experiment('change email controller', async () => {
  beforeEach(() => {
    sandbox.stub(idm, 'createEmailChangeRecord').resolves({});
    sandbox.stub(idm, 'addNewEmailToEmailChangeRecord');
    sandbox.stub(idm, 'verifySecurityCode');
    sandbox.stub(crm, 'updateEntityEmail');
    sandbox.stub(changeEmailHelpers, 'createNotificationData');
    sandbox.stub(changeEmailHelpers, 'sendEmailAddressInUseNotification');
    sandbox.stub(changeEmailHelpers, 'createEventObject');
    sandbox.stub(scheduledNotifications.repository, 'create').resolves({});
    sandbox.stub(logger, 'error');
    sandbox.stub(event.repo, 'create');
  });

  afterEach(async () => sandbox.restore());

  experiment('postStartEmailAddressChange', async () => {
    test('calls createEmailChangeRecord with correct parameters', async () => {
      await controller.postStartEmailAddressChange(request, h);
      const lastCallArgs = idm.createEmailChangeRecord.lastCall.args;
      expect(lastCallArgs[0]).to.equal(request.defra.userId);
      expect(lastCallArgs[1]).to.equal(request.payload.password);
    });
  });

  experiment('postGenerateSecurityCode', async () => {
    const testScheduledNotificationData = {
      message_ref: 'test-message-ref',
      other_data: 'other-test-data'
    };

    test('calls createEmailChangeRecord with correct parameters', async () => {
      idm.addNewEmailToEmailChangeRecord.returns({ data: { verificationCode: '123456' } });
      changeEmailHelpers.createNotificationData.returns(testScheduledNotificationData);
      await controller.postGenerateSecurityCode(request, h);
      const lastCallArgs = scheduledNotifications.repository.create.lastCall.args;
      expect(lastCallArgs[0]).to.be.an.object();
      expect(lastCallArgs[0]).to.equal(testScheduledNotificationData);
    });

    experiment('error is thrown', async () => {
      test('calls sendEmailAddressInUseNotification when error message is "Email address already in use"', async () => {
        idm.addNewEmailToEmailChangeRecord.throws('EmailChangeError', 'Email address already in use');
        await controller.postGenerateSecurityCode(request, h);
        const lastCallArgs = changeEmailHelpers.sendEmailAddressInUseNotification.lastCall.args;
        expect(lastCallArgs[0]).to.equal(request.payload.newEmail);
      });

      test('returns the error when error message !== "Email address already in use"', async () => {
        idm.addNewEmailToEmailChangeRecord.throws('EmailChangeError');
        const result = await controller.postGenerateSecurityCode(request, h);
        expect(result).to.be.an.error();
      });
    });
  });

  experiment('postChangeEmailAddress', async () => {
    test('calls verifySecurityCode with correct parameters', async () => {
      await controller.postChangeEmailAddress(request, h);
      const lastCallArgs = idm.verifySecurityCode.lastCall.args;
      expect(lastCallArgs[0]).to.equal(request.defra.userId);
      expect(lastCallArgs[1]).to.equal(request.payload.securityCode);
    });

    test('calls updateEntityEmail with correct parameters', async () => {
      idm.verifySecurityCode.returns({ data: { newEmail: 'new-email@domain.com' } });
      await controller.postChangeEmailAddress(request, h);
      const lastCallArgs = crm.updateEntityEmail.lastCall.args;
      expect(lastCallArgs[0]).to.equal(request.payload.entityId);
      expect(lastCallArgs[1]).to.equal('new-email@domain.com');
    });

    test('calls createEventObject with correct parameters', async () => {
      idm.verifySecurityCode.returns({ data: { newEmail: 'new-email@domain.com' } });
      await controller.postChangeEmailAddress(request, h);
      const lastCallArgs = changeEmailHelpers.createEventObject.lastCall.args;
      expect(lastCallArgs[0]).to.equal(request.defra.userName);
      expect(lastCallArgs[1]).to.equal(request.payload.entityId);
      expect(lastCallArgs[2]).to.equal('new-email@domain.com');
      expect(lastCallArgs[3]).to.equal(request.defra.userId);
    });

    experiment('error is thrown', async () => {
      beforeEach(() => {
        idm.verifySecurityCode.returns({ data: { newEmail: 'new-email@domain.com' } });
        crm.updateEntityEmail.throws('EmailChangeError');
      });

      afterEach(async () => sandbox.restore());

      test('log the error', async () => {
        await controller.postChangeEmailAddress(request, h);
        const lastCallArgs = logger.error.lastCall.args;
        expect(lastCallArgs[0]).to.equal('Email change error');
        expect(lastCallArgs[1]).to.be.an.error();
      });

      test('return error if error name is "EmailChangeError"', async () => {
        const result = await controller.postChangeEmailAddress(request, h);
        expect(result).to.be.an.error();
      });
    });
  });
});
