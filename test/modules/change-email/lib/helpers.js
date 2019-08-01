const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const helpers = require('../../../../src/modules/change-email/lib/helpers');
const scheduledNotifications = require('../../../../src/controllers/notifications');
const event = require('../../../../src/lib/event');

const guidRegex = /[\d|\w]{8}-[\d|\w]{4}-[\d|\w]{4}-[\d|\w]{4}-[\d|\w]{12}/;

experiment('createEventObject', () => {
  beforeEach(() => {
    sandbox.stub(event, 'create');
  });

  afterEach(async () => sandbox.restore());

  test('it calls event.create with the expected arguments', () => {
    helpers.createEventObject('test-username', 'test-id', 'teset-email@domain.com', '1234');
    const [args] = event.create.lastCall.args;
    expect(args.event_id).to.match(guidRegex);
    expect(args.issuer).to.equal('test-username');
    expect(args.entities).to.equal(['test-id']);
    expect(args.metadata.oldEmail).to.equal('test-username');
  });
});

experiment('createNotificationData', () => {
  test('it returns the expected object', () => {
    const result = helpers.createNotificationData('message-ref', 'test-email@domain.com', { data: 'test-personaliation' });
    expect(result).to.be.an.object();
    expect(result.id).to.match(guidRegex);
    expect(result.message_ref).to.equal('message-ref');
    expect(result.personalisation).to.equal({ data: 'test-personaliation' });
  });
});

experiment('sendVerificationCodeEmail', () => {
  beforeEach(() => {
    sandbox.stub(scheduledNotifications.repository, 'create');
  });

  afterEach(async () => sandbox.restore());

  test('it calls scheduledNotifications.repository.create with the expected arguments', () => {
    helpers.sendVerificationCodeEmail('test-email@domain.com', 123456);
    const [args] = scheduledNotifications.repository.create.lastCall.args;
    expect(args.message_ref).to.equal('email_change_verification_code');
    expect(args.recipient).to.equal('test-email@domain.com');
    expect(args.personalisation.verification_code).to.equal(123456);
  });
});

experiment('sendEmailAddressInUseNotification', () => {
  beforeEach(() => {
    sandbox.stub(scheduledNotifications.repository, 'create');
  });

  afterEach(async () => sandbox.restore());

  test('it calls scheduledNotifications.repository.create with the expected arguments', () => {
    helpers.sendEmailAddressInUseNotification('test-email@domain.com');
    const [args] = scheduledNotifications.repository.create.lastCall.args;
    expect(args.message_ref).to.equal('email_change_email_in_use');
    expect(args.recipient).to.equal('test-email@domain.com');
    expect(args.personalisation.link).to.equal(`${process.env.BASE_URL}/signin`);
    expect(args.personalisation.resetLink).to.equal(`${process.env.BASE_URL}/reset_password`);
  });
});
