const NotifyClient = require('notifications-node-client').NotifyClient;
const { expect } = require('@hapi/code');
const {
  experiment, test, beforeEach
} = exports.lab = require('@hapi/lab').script();

const notifyConnector =
  require('../../../src/lib/connectors/notify');

const createEnv = nodeEnv => ({
  LIVE_NOTIFY_KEY: 'live-key',
  WHITELIST_NOTIFY_KEY: 'whitelist-key',
  TEST_NOTIFY_KEY: 'test-key',
  NODE_ENV: nodeEnv
});

experiment('lib/connectors/notify', () => {
  let env;

  experiment('.messageTypes', () => {
    test('defines a string for each message type', async () => {
      expect(notifyConnector.messageTypes.email).to.equal('email');
      expect(notifyConnector.messageTypes.letter).to.equal('letter');
      expect(notifyConnector.messageTypes.sms).to.equal('sms');
    });
  });

  experiment('.getKey', () => {
    experiment('when the environment is production', () => {
      beforeEach(async () => {
        env = createEnv('production');
      });

      test('email is sent with live key', async () => {
        expect(
          notifyConnector._getKey(env, notifyConnector.messageTypes.email)
        ).to.equal(env.LIVE_NOTIFY_KEY);
      });

      test('letters are sent with live key', async () => {
        expect(
          notifyConnector._getKey(env, notifyConnector.messageTypes.letter)
        ).to.equal(env.LIVE_NOTIFY_KEY);
      });

      test('SMS is sent with live key', async () => {
        expect(
          notifyConnector._getKey(env, notifyConnector.messageTypes.sms)
        ).to.equal(env.LIVE_NOTIFY_KEY);
      });
    });

    experiment('when the environment is not production', () => {
      beforeEach(async () => {
        env = createEnv('test');
      });

      test('email is sent with whitelist key', async () => {
        expect(
          notifyConnector._getKey(env, notifyConnector.messageTypes.email)
        ).to.equal(env.WHITELIST_NOTIFY_KEY);
      });

      test('letters are sent with test key', async () => {
        expect(
          notifyConnector._getKey(env, notifyConnector.messageTypes.letter)
        ).to.equal(env.TEST_NOTIFY_KEY);
      });

      test('SMS is sent with whitelist key', async () => {
        expect(
          notifyConnector._getKey(env, notifyConnector.messageTypes.sms)
        ).to.equal(env.WHITELIST_NOTIFY_KEY);
      });
    });
  });

  experiment('.getClient', () => {
    beforeEach(async () => {
      env = createEnv('test');
    });

    test('returns a Notify API client', async () => {
      const client = notifyConnector.getClient(notifyConnector.messageTypes.email, env);
      expect(
        client instanceof NotifyClient
      ).to.be.true();
    });
  });
});
