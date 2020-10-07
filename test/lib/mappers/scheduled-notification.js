'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const mapper = require('../../../src/lib/mappers/scheduled-notification');
const ScheduledNotification = require('../../../src/lib/models/scheduled-notification');

experiment('modules/billing/mappers/scheduled-notification', () => {
  experiment('.dbToModel', () => {
    let result;
    let dbRow;

    beforeEach(async () => {
      dbRow = {
        id: '6e4b0cb8-7d37-4119-be3b-855c6a26b3be',
        recipient: 'test@example.com',
        messageRef: 'test_ref',
        messageType: 'letter',
        personalisation: {
          one: 1,
          two: 2
        }
      };

      result = mapper.dbToModel(dbRow);
    });

    test('returns a ScheduledNotification instance', async () => {
      expect(result instanceof ScheduledNotification).to.be.true();
    });

    test('maps the id', async () => {
      expect(result.id).to.equal(dbRow.id);
    });

    test('maps the recipient', async () => {
      expect(result.recipient).to.equal(dbRow.recipient);
    });

    test('maps the messageRef', async () => {
      expect(result.messageRef).to.equal(dbRow.messageRef);
    });

    test('maps the messageType', async () => {
      expect(result.messageType).to.equal(dbRow.messageType);
    });

    test('maps the personalisation', async () => {
      expect(result.personalisation).to.equal(dbRow.personalisation);
    });
  });
});
