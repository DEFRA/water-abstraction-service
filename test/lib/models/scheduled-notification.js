'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const ScheduledNotification = require('../../../src/lib/models/scheduled-notification');

experiment('lib/models/scheduled-notification', () => {
  experiment('construction', () => {
    test('can include the id', async () => {
      const id = uuid();
      const notification = new ScheduledNotification(id);
      expect(notification.id).to.equal(id);
    });
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      const notification = new ScheduledNotification();
      const id = uuid();
      notification.id = id;
      expect(notification.id).to.equal(id);
    });

    test('throws an error if set to a non-guid string', async () => {
      expect(() => {
        const notification = new ScheduledNotification();
        notification.id = 'identify';
      }).to.throw();
    });
  });

  experiment('.messageType', () => {
    test('can be set to a "letter"', async () => {
      const messageType = 'letter';

      const notification = new ScheduledNotification();
      notification.messageType = messageType;

      expect(notification.messageType).to.equal(messageType);
    });

    test('can be set to a "email"', async () => {
      const messageType = 'email';

      const notification = new ScheduledNotification();
      notification.messageType = messageType;

      expect(notification.messageType).to.equal(messageType);
    });

    test('can be set to a "sms"', async () => {
      const messageType = 'sms';

      const notification = new ScheduledNotification();
      notification.messageType = messageType;

      expect(notification.messageType).to.equal(messageType);
    });

    test('throws an error if set to an unexpected string', async () => {
      expect(() => {
        const notification = new ScheduledNotification();
        notification.messageType = 'invalid-type';
      }).to.throw();
    });

    test('throws an error if set to null', async () => {
      expect(() => {
        const notification = new ScheduledNotification();
        notification.messageType = null;
      }).to.throw();
    });

    test('throws an error if set to a number', async () => {
      expect(() => {
        const notification = new ScheduledNotification();
        notification.messageType = 123;
      }).to.throw();
    });
  });

  experiment('.recipient', () => {
    test('can be set to a string', async () => {
      const recipient = 'test@example.com';

      const notification = new ScheduledNotification();
      notification.recipient = recipient;

      expect(notification.recipient).to.equal(recipient);
    });

    test('can be set to null', async () => {
      const notification = new ScheduledNotification();
      notification.recipient = null;

      expect(notification.recipient).to.equal(null);
    });

    test('throws an error if set to a number', async () => {
      expect(() => {
        const notification = new ScheduledNotification();
        notification.recipient = 123;
      }).to.throw();
    });
  });

  experiment('.messageRef', () => {
    test('can be set to a string', async () => {
      const messageRef = 'test_template';

      const notification = new ScheduledNotification();
      notification.messageRef = messageRef;

      expect(notification.messageRef).to.equal(messageRef);
    });

    test('can be set to null', async () => {
      const notification = new ScheduledNotification();
      notification.messageRef = null;

      expect(notification.messageRef).to.equal(null);
    });

    test('throws an error if set to a number', async () => {
      expect(() => {
        const notification = new ScheduledNotification();
        notification.messageRef = 123;
      }).to.throw();
    });
  });

  experiment('.eventId', () => {
    test('can be set to a uuid', async () => {
      const eventId = uuid();

      const notification = new ScheduledNotification();
      notification.eventId = eventId;

      expect(notification.eventId).to.equal(eventId);
    });

    test('can be set to null', async () => {
      const notification = new ScheduledNotification();
      notification.eventId = null;

      expect(notification.eventId).to.equal(null);
    });

    test('throws an error if set to a non-uuid string', async () => {
      expect(() => {
        const notification = new ScheduledNotification();
        notification.eventId = 'not-a-uuid';
      }).to.throw();
    });
  });

  experiment('.licences', () => {
    test('can be set to null', async () => {
      const notification = new ScheduledNotification();
      notification.licences = null;

      expect(notification.licences).to.equal(null);
    });

    test('can be set to an empty array', async () => {
      const licences = [];

      const notification = new ScheduledNotification();
      notification.licences = licences;

      expect(notification.licences).to.equal(licences);
    });

    test('can be set to an array of licence numbers', async () => {
      const licences = ['01/123/*S/456', '04/567/*G/S/R01'];

      const notification = new ScheduledNotification();
      notification.licences = licences;

      expect(notification.licences).to.equal(licences);
    });

    test('throws an error if array contains an invalid licence number', async () => {
      expect(() => {
        const licences = ['1234_5678'];

        const notification = new ScheduledNotification();
        notification.licences = licences;
      }).to.throw();
    });
  });

  experiment('.status', () => {
    test('can be set to a "draft"', async () => {
      const status = 'draft';

      const notification = new ScheduledNotification();
      notification.status = status;

      expect(notification.status).to.equal(status);
    });

    test('can be set to a "sending"', async () => {
      const status = 'sending';

      const notification = new ScheduledNotification();
      notification.status = status;

      expect(notification.status).to.equal(status);
    });

    test('can be set to a "sent"', async () => {
      const status = 'sent';

      const notification = new ScheduledNotification();
      notification.status = status;

      expect(notification.status).to.equal(status);
    });

    test('can be set to a "error"', async () => {
      const status = 'error';

      const notification = new ScheduledNotification();
      notification.status = status;

      expect(notification.status).to.equal(status);
    });

    test('throws an error if the status is invalid', async () => {
      expect(() => {
        const notification = new ScheduledNotification();
        notification.status = 'the-dog-ate-it';
      }).to.throw();
    });

    test('can be set to null', async () => {
      const notification = new ScheduledNotification();
      notification.status = null;

      expect(notification.status).to.equal(null);
    });
  });

  experiment('.notifyStatus', () => {
    test('can be set to a string', async () => {
      const notifyStatus = 'delivered';

      const notification = new ScheduledNotification();
      notification.notifyStatus = notifyStatus;

      expect(notification.notifyStatus).to.equal(notifyStatus);
    });

    test('can be set to null', async () => {
      const notification = new ScheduledNotification();
      notification.notifyStatus = null;

      expect(notification.notifyStatus).to.equal(null);
    });

    test('throws an error if set to a number', async () => {
      expect(() => {
        const notification = new ScheduledNotification();
        notification.notifyStatus = 123;
      }).to.throw();
    });
  });
});
