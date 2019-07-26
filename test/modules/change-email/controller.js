const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('../../../src/modules/change-email/controller');
const changeEmailHelpers = require('../../../src/modules/change-email/lib/helpers');
const idm = require('../../../src/lib/connectors/idm');
const crm = require('../../../src/lib/connectors/crm/entities');
const { logger } = require('../../../src/logger');
const event = require('../../../src/lib/event');

const request = {
  payload: {
    password: 'test-password',
    verificationId: '1234-asdf-qwert',
    newEmail: 'new-email@domain.com',
    securityCode: '98765',
    entityId: '957u-037m-jkd7',
    userId: 1234,
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
    sandbox.stub(changeEmailHelpers, 'sendVerificationCodeEmail');
    sandbox.stub(logger, 'error');
    sandbox.stub(event.repo, 'create');
  });

  afterEach(async () => sandbox.restore());

  experiment('postStartEmailAddressChange', async () => {
    test('calls createEmailChangeRecord with correct parameters', async () => {
      await controller.postStartEmailAddressChange(request, h);
      const [userId, password] = idm.createEmailChangeRecord.lastCall.args;
      expect(userId).to.equal(request.payload.userId);
      expect(password).to.equal(request.payload.password);
    });
  });

  experiment('postGenerateSecurityCode', async () => {
    const testScheduledNotificationData = {
      message_ref: 'test-message-ref',
      other_data: 'other-test-data'
    };

    test('calls sendVerificationCodeEmail with correct parameters', async () => {
      idm.addNewEmailToEmailChangeRecord.returns({ data: { verificationCode: 123456 } });
      changeEmailHelpers.createNotificationData.returns(testScheduledNotificationData);
      await controller.postGenerateSecurityCode(request, h);
      const [newEmail, verificationCode] = changeEmailHelpers.sendVerificationCodeEmail.lastCall.args;
      expect(newEmail).to.equal(request.payload.newEmail);
      expect(verificationCode).to.equal(123456);
    });

    experiment('error is thrown', async () => {
      test('calls sendEmailAddressInUseNotification when error message is "Email address already in use"', async () => {
        idm.addNewEmailToEmailChangeRecord.throws('EmailChangeError', 'Email address already in use');
        await controller.postGenerateSecurityCode(request, h);
        const [newEmail] = changeEmailHelpers.sendEmailAddressInUseNotification.lastCall.args;
        expect(newEmail).to.equal(request.payload.newEmail);
      });

      test('returns the error when error message !== "Email address already in use"', async () => {
        idm.addNewEmailToEmailChangeRecord.throws('EmailChangeError');
        const result = await controller.postGenerateSecurityCode(request, h);
        expect(result.data).to.be.null();
        expect(result.error).to.be.an.error();
      });
    });
  });

  experiment('postChangeEmailAddress', async () => {
    test('calls verifySecurityCode with correct parameters', async () => {
      await controller.postChangeEmailAddress(request, h);
      const [userId, securityCode] = idm.verifySecurityCode.lastCall.args;
      expect(userId).to.equal(request.payload.userId);
      expect(securityCode).to.equal(request.payload.securityCode);
    });

    test('calls updateEntityEmail with correct parameters', async () => {
      idm.verifySecurityCode.returns({ data: { newEmail: 'new-email@domain.com' } });
      await controller.postChangeEmailAddress(request, h);
      const [entityId, newEmail] = crm.updateEntityEmail.lastCall.args;
      expect(entityId).to.equal(request.payload.entityId);
      expect(newEmail).to.equal('new-email@domain.com');
    });

    test('calls createEventObject with correct parameters', async () => {
      idm.verifySecurityCode.returns({ data: { newEmail: 'new-email@domain.com' } });
      await controller.postChangeEmailAddress(request, h);
      const [userName, entityId, newEmail, userId] = changeEmailHelpers.createEventObject.lastCall.args;
      expect(userName).to.equal(request.payload.userName);
      expect(entityId).to.equal(request.payload.entityId);
      expect(newEmail).to.equal('new-email@domain.com');
      expect(userId).to.equal(request.payload.userId);
    });

    experiment('error is thrown', async () => {
      beforeEach(() => {
        idm.verifySecurityCode.returns({ data: { newEmail: 'new-email@domain.com' } });
        crm.updateEntityEmail.throws('EmailChangeError');
      });

      afterEach(async () => sandbox.restore());

      test('log the error', async () => {
        await controller.postChangeEmailAddress(request, h);
        const error = logger.error.lastCall.args;
        expect(error[0]).to.equal('Email change error');
        expect(error[1]).to.be.an.error();
      });

      test('return error if error name is "EmailChangeError"', async () => {
        const result = await controller.postChangeEmailAddress(request, h);
        expect(result.data).to.be.null();
        expect(result.error).to.be.an.error();
      });
    });
  });
});
