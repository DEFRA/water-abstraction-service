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
    test('can be set to a string', async () => {
      const messageType = 'letter';

      const notification = new ScheduledNotification();
      notification.messageType = messageType;

      expect(notification.messageType).to.equal(messageType);
    });

    test('can be set to null', async () => {
      const notification = new ScheduledNotification();
      notification.messageType = null;

      expect(notification.messageType).to.equal(null);
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

  experiment('.personalisation', () => {
    test('can be set to an object', async () => {
      const personalisation = 'test_template';

      const notification = new ScheduledNotification();
      notification.personalisation = personalisation;

      expect(notification.personalisation).to.equal(personalisation);
    });

    test('can be set to null', async () => {
      const notification = new ScheduledNotification();
      notification.personalisation = null;

      expect(notification.personalisation).to.equal(null);
    });
  });
});
