'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const User = require('../../../src/lib/models/user');

experiment('lib/models/user', () => {
  let user;

  beforeEach(async () => {
    user = new User();
  });

  experiment('.id', () => {
    test('can be set to a positive integer', async () => {
      user.id = 7593;
      expect(user.id).to.equal(7593);
    });

    test('throws an error if not set to a positive integer', async () => {
      const func = () => {
        user.id = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.email', () => {
    test('can be set to a valid email address', async () => {
      user.email = 'test@example.com';
      expect(user.email).to.equal('test@example.com');
    });

    test('throws an error if string is not a valid email', async () => {
      const func = () => {
        user.email = 'not-an-email';
      };
      expect(func).to.throw();
    });
  });
});
