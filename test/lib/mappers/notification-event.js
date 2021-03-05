'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const mapper = require('../../../src/lib/mappers/notification-event');
const NotificationEvent = require('../../../src/lib/models/notification-event');

const { MESSAGE_STATUSES, NOTIFY_STATUSES } = require('../../../src/lib/models/scheduled-notification');

const DATE_FORMAT = 'YYYY-MM-DD';

const row = {
  recipientCount: 10,
  issuer: 'somebody@example.com',
  type: 'notification',
  subtype: 'paperForms',
  metadata: { foo: 'bar' },
  created: '2021-01-01',
  modified: '2021-01-02',
  referenceCode: 'ABC123',
  statuses: [
    {
      status: MESSAGE_STATUSES.draft,
      count: 1
    },
    {
      status: MESSAGE_STATUSES.sending,
      count: 2
    },
    {
      status: MESSAGE_STATUSES.sent,
      count: 3
    },
    {
      status: MESSAGE_STATUSES.error,
      count: 5
    },
    {
      status: NOTIFY_STATUSES.accepted,
      count: 8
    },
    {
      status: NOTIFY_STATUSES.permanentFailure,
      count: 13
    },
    {
      status: NOTIFY_STATUSES.temporaryFailure,
      count: 21
    },
    {
      status: NOTIFY_STATUSES.technicalFailure,
      count: 34
    },
    {
      status: NOTIFY_STATUSES.validationFailure,
      count: 55
    },
    {
      status: NOTIFY_STATUSES.delivered,
      count: 89
    },
    {
      status: NOTIFY_STATUSES.sending,
      count: 144
    },
    {
      status: NOTIFY_STATUSES.received,
      count: 233
    },
    {
      status: NOTIFY_STATUSES.error,
      count: 377
    }
  ]
};

experiment('modules/billing/mappers/notification-event', () => {
  experiment('.dbToModel', () => {
    let result;

    beforeEach(async () => {
      result = mapper.dbToModel(row);
    });

    test('returns a NotificationEvent model', async () => {
      expect(result instanceof NotificationEvent).to.be.true();
    });

    test('maps id', async () => {
      expect(result.id).to.equal(row.eventId);
    });

    const copiedProperties = [
      'recipientCount',
      'issuer',
      'type',
      'subtype',
      'metadata',
      'referenceCode'
    ];

    copiedProperties.forEach(property => {
      test(`maps ${property}`, async () => {
        expect(result[property]).to.equal(row[property]);
      });
    });

    test('maps .created to a moment', async () => {
      expect(result.created.format(DATE_FORMAT)).to.equal(row.created);
    });

    test('maps .modified to a moment', async () => {
      expect(result.modified.format(DATE_FORMAT)).to.equal(row.modified);
    });

    test('maps the statuses array to a single error count', async () => {
      expect(result.errorCount).to.equal(505);
    });
  });
});
