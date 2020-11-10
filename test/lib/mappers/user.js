'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const User = require('../../../src/lib/models/user');
const userMapper = require('../../../src/lib/mappers/user');

experiment('modules/billing/mappers/user .dbToModel', () => {
  experiment('.dbToModel', () => {
    let user, result;
    beforeEach(() => {
      user = { id: 1234, email: 'test@example.com' };
      result = userMapper.dbToModel(user);
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
        result = userMapper.dbToModel(null);
      });

      test('returns null', () => {
        expect(result).to.be.null();
      });
    });
  });

  experiment('.pojoToModel', () => {
    let user, result;
    beforeEach(() => {
      user = { id: 1234, email: 'test@example.com' };
      result = userMapper.pojoToModel(user);
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
        result = userMapper.dbToModel(null);
      });

      test('returns null', () => {
        expect(result).to.be.null();
      });
    });
  });

  experiment('.modelToDb', () => {
    let result;

    beforeEach(() => {
      const model = new User(1234, 'test@example.com');
      result = userMapper.modelToDb(model);
    });

    test('maps data correctly', () => {
      expect(result.id).to.equal(1234);
      expect(result.email).to.equal('test@example.com');
    });

    test('handles null values', () => {
      result = userMapper.modelToDb(null);
      expect(result).to.be.null();
    });
  });
});
