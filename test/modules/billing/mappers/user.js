'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const User = require('../../../../src/lib/models/user');
const userMapper = require('../../../../src/modules/billing/mappers/user');

experiment('modules/billing/mappers/user .mapToModel', () => {
  let user, result;
  beforeEach(() => {
    user = { id: 1234, email: 'test@example.com' };
    result = userMapper.mapToModel(user);
  });

  test('result is a User model', () => {
    expect(result).to.be.instanceOf(User);
  });

  test('maps data correctly', () => {
    expect(result.id).to.equal(user.id);
    expect(result.email).to.equal(user.email);
  });

  experiment('when data passed in is null', () => {
    beforeEach(() => {
      result = userMapper.mapToModel(null);
    });

    test('returns null', () => {
      expect(result).to.be.null();
    });
  });
});
