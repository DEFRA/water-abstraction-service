'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const uuid = require('uuid/v4');
const moment = require('moment');

const ContactRole = require('../../../src/lib/models/contact-role');

experiment('lib/models/role-v2', () => {
  let role;

  beforeEach(async () => {
    role = new ContactRole();
  });

  experiment('.id', () => {
    test('can be set to a valid UUID', async () => {
      const id = uuid();
      role.id = id;
      expect(role.id).to.equal(id);
    });

    test('throws an error if attempting to set non-guid ID', async () => {
      expect(() => {
        role.id = 'potatoes';
      }).to.throw();
    });
  });

  experiment('.name', () => {
    test('can be set to a valid string', async () => {
      const name = 'billing';
      role.name = name;
      expect(role.name).to.equal(name);
    });

    test('throws an error if attempting to an unexpected value', async () => {
      expect(() => {
        role.name = 'potatoes';
      }).to.throw();
    });
  });

  experiment('.dateCreated', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z';
      role.dateCreated = dateString;

      expect(role.dateCreated).to.equal(moment(dateString));
    });

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date();
      role.dateCreated = date;

      expect(role.dateCreated).to.equal(moment(date));
    });

    test('can be set using a moment', async () => {
      const now = moment();
      role.dateCreated = now;

      expect(role.dateCreated).to.equal(now);
    });

    test('throws for an invalid string', async () => {
      const dateString = 'not a date';

      expect(() => {
        role.dateCreated = dateString;
      }).to.throw();
    });

    test('throws for a boolean value', async () => {
      expect(() => {
        role.dateCreated = true;
      }).to.throw();
    });

    test('allows null', async () => {
      role.dateCreated = null;
      expect(role.dateCreated).to.be.null();
    });
  });

  experiment('.dateUpdated', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z';
      role.dateUpdated = dateString;

      expect(role.dateUpdated).to.equal(moment(dateString));
    });

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date();
      role.dateUpdated = date;

      expect(role.dateUpdated).to.equal(moment(date));
    });

    test('can be set using a moment', async () => {
      const now = moment();
      role.dateUpdated = now;

      expect(role.dateUpdated).to.equal(now);
    });

    test('throws for an invalid string', async () => {
      const dateString = 'not a date';

      expect(() => {
        role.dateUpdated = dateString;
      }).to.throw();
    });

    test('throws for a boolean value', async () => {
      expect(() => {
        role.dateUpdated = true;
      }).to.throw();
    });

    test('allows null', async () => {
      role.dateUpdated = null;
      expect(role.dateUpdated).to.be.null();
    });
  });
});
