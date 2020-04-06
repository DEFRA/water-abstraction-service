'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect, fail } = require('@hapi/code');
const uuid = require('uuid/v4');

const validators = require('../../../src/lib/models/validators');

class TestClass {}

experiment('lib/models/validators', () => {
  experiment('assertIsArrayOfType', () => {
    test('handles an empty array', async () => {
      const func = () => validators.assertIsArrayOfType([], TestClass);
      expect(func).not.to.throw();
    });

    test('throws for a string', async () => {
      const func = () => validators.assertIsArrayOfType('nope', TestClass);
      expect(func).to.throw();
    });

    test('throws for an array not containg the specified type', async () => {
      const func = () => validators.assertIsArrayOfType([1, 2, 3], TestClass);
      expect(func).to.throw();
    });

    test('reports the error with the Type name', async () => {
      try {
        validators.assertIsArrayOfType([1, 2, 3], TestClass);
        fail('Should not get here');
      } catch (err) {
        expect(err.message).to.equal('TestClass expected at position 0');
      }
    });
  });

  experiment('assertIsInstanceOf', () => {
    test('does not throw when the value is of the specified type', async () => {
      const func = () => validators.assertIsInstanceOf(new TestClass(), TestClass);
      expect(func).not.to.throw();
    });

    test('throws when the value is not of the specified type', async () => {
      const func = () => validators.assertIsInstanceOf('Not valid', TestClass);
      expect(func).to.throw();
    });

    test('reports the error with the Type name', async () => {
      try {
        validators.assertIsInstanceOf(123, TestClass);
        fail('Should not get here');
      } catch (err) {
        expect(err.message).to.equal('TestClass expected');
      }
    });
  });

  experiment('assertIsNullableInstanceOf', () => {
    test('does not throw when the value is of the specified type', async () => {
      const func = () => validators.assertIsNullableInstanceOf(new TestClass(), TestClass);
      expect(func).not.to.throw();
    });

    test('throws when the value is not of the specified type', async () => {
      const func = () => validators.assertIsNullableInstanceOf('Not valid', TestClass);
      expect(func).to.throw();
    });

    test('allows null', async () => {
      const func = () => validators.assertIsNullableInstanceOf(null, TestClass);
      expect(func).not.to.throw();
    });

    test('reports the error with the Type name', async () => {
      try {
        validators.assertIsInstanceOf(123, TestClass);
        fail('Should not get here');
      } catch (err) {
        expect(err.message).to.equal('TestClass expected');
      }
    });
  });

  experiment('assertAccountNumber', () => {
    test('does not throw for a valid account number', async () => {
      const func = () => validators.assertAccountNumber('A12345678A');
      expect(func).not.to.throw();
    });

    test('throws for an invalid account number', async () => {
      const func = () => validators.assertAccountNumber('nope');
      expect(func).to.throw();
    });

    test('throws for an integer', async () => {
      const func = () => validators.assertAccountNumber(1);
      expect(func).to.throw();
    });

    test('throws for undefined', async () => {
      const func = () => validators.assertAccountNumber();
      expect(func).to.throw();
    });
  });

  experiment('assertLicenceNumber', () => {
    test('does not throw for a valid licence number', async () => {
      const func = () => validators.assertLicenceNumber('0123/ABC');
      expect(func).not.to.throw();
    });

    test('throws for an invalid licence number', async () => {
      const func = () => validators.assertLicenceNumber('0123/abc??');
      expect(func).to.throw();
    });

    test('throws for an integer', async () => {
      const func = () => validators.assertLicenceNumber(1);
      expect(func).to.throw();
    });

    test('throws for undefined', async () => {
      const func = () => validators.assertLicenceNumber();
      expect(func).to.throw();
    });
  });

  experiment('assertId', () => {
    test('does not throw for a valid uuid', async () => {
      const func = () => validators.assertId(uuid());
      expect(func).not.to.throw();
    });

    test('throws for an invalid id', async () => {
      const func = () => validators.assertId('potatoes');
      expect(func).to.throw();
    });

    test('throws for an integer', async () => {
      const func = () => validators.assertId(1);
      expect(func).to.throw();
    });

    test('throws for undefined', async () => {
      const func = () => validators.assertId();
      expect(func).to.throw();
    });
  });

  experiment('assertNullableString', () => {
    test('does not throw for null', async () => {
      const func = () => validators.assertNullableString(null);
      expect(func).not.to.throw();
    });

    test('does not throw for a string', async () => {
      const func = () => validators.assertNullableString('I am valid!');
      expect(func).not.to.throw();
    });

    test('throws for an integer', async () => {
      const func = () => validators.assertNullableString(1234);
      expect(func).to.throw();
    });

    test('throws for undefined', async () => {
      const func = () => validators.assertNullableString();
      expect(func).to.throw();
    });
  });

  experiment('assertIsBoolean', () => {
    test('does not throw for false', async () => {
      const func = () => validators.assertIsBoolean(false);
      expect(func).not.to.throw();
    });

    test('does not throw for true', async () => {
      const func = () => validators.assertIsBoolean(true);
      expect(func).not.to.throw();
    });

    test('throws for an integer', async () => {
      const func = () => validators.assertIsBoolean(1234);
      expect(func).to.throw();
    });

    test('throws for undefined', async () => {
      const func = () => validators.assertIsBoolean();
      expect(func).to.throw();
    });
  });

  experiment('assertTransactionKey', () => {
    test('does not throw for a valid 32 char key', async () => {
      const valid = '0123456789ABCDEF0123456789ABCDEF';
      const func = () => validators.assertTransactionKey(valid);
      expect(func).not.to.throw();
    });

    test('does not throw for null', async () => {
      const valid = null;
      const func = () => validators.assertTransactionKey(valid);
      expect(func).not.to.throw();
    });

    test('throws for 32 char string with invalid hex values', async () => {
      const invalid = '3456789ABCDEF0123456789ABCDEF_GH';
      const func = () => validators.assertTransactionKey(invalid);
      expect(func).to.throw();
    });

    test('throws if string is less than 32 chars', async () => {
      const invalid = '0123456789ABCDEF';
      const func = () => validators.assertTransactionKey(invalid);
      expect(func).to.throw();
    });

    test('throws if string is longer than 32 chars', async () => {
      const invalid = '0123456789ABCDEF0123456789ABCDEF0';
      const func = () => validators.assertTransactionKey(invalid);
      expect(func).to.throw();
    });
  });

  experiment('.assertNullableEnum', () => {
    test('allows null', async () => {
      const numberEnum = { one: 1, two: 2 };
      expect(() => {
        validators.assertNullableEnum(null, Object.values(numberEnum));
      }).not.to.throw();
    });

    test('allows a value from the defined enum', async () => {
      const numberEnum = { one: 1, two: 2 };
      expect(() => {
        validators.assertNullableEnum(numberEnum.two, Object.values(numberEnum));
      }).not.to.throw();
    });

    test('rejects a value from outside the defined enum', async () => {
      const numberEnum = { one: 1, two: 2 };
      expect(() => {
        validators.assertNullableEnum(1123, Object.values(numberEnum));
      }).to.throw();
    });
  });

  experiment('.assertEmailAddress', () => {
    test('allows a valid email address', async () => {
      expect(() => {
        validators.assertEmailAddress('test@example.com');
      }).not.to.throw();
    });

    test('rejects an invalid email address', async () => {
      expect(() => {
        validators.assertNullableEnum('test@example');
      }).to.throw();
    });
  });
});
