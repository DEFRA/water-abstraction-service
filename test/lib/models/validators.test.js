'use strict'

const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { expect, fail } = require('@hapi/code')
const uuid = require('uuid/v4')

const validators = require('../../../src/lib/models/validators')

class TestClass {}

experiment('lib/models/validators', () => {
  experiment('assertIsArrayOfType', () => {
    test('handles an empty array', async () => {
      const func = () => validators.assertIsArrayOfType([], TestClass)
      expect(func).not.to.throw()
    })

    test('throws for a string', async () => {
      const func = () => validators.assertIsArrayOfType('nope', TestClass)
      expect(func).to.throw()
    })

    test('throws for an array not containg the specified type', async () => {
      const func = () => validators.assertIsArrayOfType([1, 2, 3], TestClass)
      expect(func).to.throw()
    })

    test('reports the error with the Type name', async () => {
      try {
        validators.assertIsArrayOfType([1, 2, 3], TestClass)
        fail('Should not get here')
      } catch (err) {
        expect(err.message).to.equal('TestClass expected at position 0')
      }
    })
  })

  experiment('assertIsInstanceOf', () => {
    test('does not throw when the value is of the specified type', async () => {
      const func = () => validators.assertIsInstanceOf(new TestClass(), TestClass)
      expect(func).not.to.throw()
    })

    test('throws when the value is not of the specified type', async () => {
      const func = () => validators.assertIsInstanceOf('Not valid', TestClass)
      expect(func).to.throw()
    })

    test('reports the error with the Type name', async () => {
      try {
        validators.assertIsInstanceOf(123, TestClass)
        fail('Should not get here')
      } catch (err) {
        expect(err.message).to.equal('TestClass expected')
      }
    })
  })

  experiment('assertIsNullableInstanceOf', () => {
    test('does not throw when the value is of the specified type', async () => {
      const func = () => validators.assertIsNullableInstanceOf(new TestClass(), TestClass)
      expect(func).not.to.throw()
    })

    test('throws when the value is not of the specified type', async () => {
      const func = () => validators.assertIsNullableInstanceOf('Not valid', TestClass)
      expect(func).to.throw()
    })

    test('allows null', async () => {
      const func = () => validators.assertIsNullableInstanceOf(null, TestClass)
      expect(func).not.to.throw()
    })

    test('reports the error with the Type name', async () => {
      try {
        validators.assertIsInstanceOf(123, TestClass)
        fail('Should not get here')
      } catch (err) {
        expect(err.message).to.equal('TestClass expected')
      }
    })
  })

  experiment('assertAccountNumber', () => {
    test('does not throw for a valid account number', async () => {
      const func = () => validators.assertAccountNumber('A12345678A')
      expect(func).not.to.throw()
    })

    test('throws for an invalid account number', async () => {
      const func = () => validators.assertAccountNumber('nope')
      expect(func).to.throw()
    })

    test('throws for an integer', async () => {
      const func = () => validators.assertAccountNumber(1)
      expect(func).to.throw()
    })

    test('throws for undefined', async () => {
      const func = () => validators.assertAccountNumber()
      expect(func).to.throw()
    })
  })

  experiment('assertLicenceNumber', () => {
    test('does not throw for a valid licence number', async () => {
      const func = () => validators.assertLicenceNumber('0123/ABC')
      expect(func).not.to.throw()
    })

    test('throws for an invalid licence number', async () => {
      const func = () => validators.assertLicenceNumber('0123/abc??')
      expect(func).to.throw()
    })

    test('throws for an integer', async () => {
      const func = () => validators.assertLicenceNumber(1)
      expect(func).to.throw()
    })

    test('throws for undefined', async () => {
      const func = () => validators.assertLicenceNumber()
      expect(func).to.throw()
    })
  })

  experiment('assertId', () => {
    test('does not throw for a valid uuid', async () => {
      const func = () => validators.assertId(uuid())
      expect(func).not.to.throw()
    })

    test('throws for an invalid id', async () => {
      const func = () => validators.assertId('potatoes')
      expect(func).to.throw()
    })

    test('throws for an integer', async () => {
      const func = () => validators.assertId(1)
      expect(func).to.throw()
    })

    test('throws for undefined', async () => {
      const func = () => validators.assertId()
      expect(func).to.throw()
    })
  })

  experiment('assertNullableId', () => {
    test('does not throw for a valid uuid', async () => {
      const func = () => validators.assertNullableId(uuid())
      expect(func).not.to.throw()
    })

    test('does not throw for null', async () => {
      const func = () => validators.assertNullableId(null)
      expect(func).not.to.throw()
    })

    test('throws for an invalid id', async () => {
      const func = () => validators.assertNullableId('potatoes')
      expect(func).to.throw()
    })

    test('throws for an integer', async () => {
      const func = () => validators.assertNullableId(1)
      expect(func).to.throw()
    })

    test('throws for undefined', async () => {
      const func = () => validators.assertNullableId()
      expect(func).to.throw()
    })
  })

  experiment('assertNullableString', () => {
    test('does not throw for null', async () => {
      const func = () => validators.assertNullableString(null)
      expect(func).not.to.throw()
    })

    test('does not throw for a string', async () => {
      const func = () => validators.assertNullableString('I am valid!')
      expect(func).not.to.throw()
    })

    test('throws for an integer', async () => {
      const func = () => validators.assertNullableString(1234)
      expect(func).to.throw()
    })

    test('throws for undefined', async () => {
      const func = () => validators.assertNullableString()
      expect(func).to.throw()
    })
  })

  experiment('assertIsBoolean', () => {
    test('does not throw for false', async () => {
      const func = () => validators.assertIsBoolean(false)
      expect(func).not.to.throw()
    })

    test('does not throw for true', async () => {
      const func = () => validators.assertIsBoolean(true)
      expect(func).not.to.throw()
    })

    test('throws for an integer', async () => {
      const func = () => validators.assertIsBoolean(1234)
      expect(func).to.throw()
    })

    test('throws for undefined', async () => {
      const func = () => validators.assertIsBoolean()
      expect(func).to.throw()
    })
  })

  experiment('assertNullableBoolean', () => {
    test('does not throw for false', async () => {
      const func = () => validators.assertIsNullableBoolean(false)
      expect(func).not.to.throw()
    })

    test('does not throw for true', async () => {
      const func = () => validators.assertIsNullableBoolean(true)
      expect(func).not.to.throw()
    })

    test('does not throw for null', async () => {
      const func = () => validators.assertIsNullableBoolean(null)
      expect(func).not.to.throw()
    })

    test('throws for an integer', async () => {
      const func = () => validators.assertIsNullableBoolean(1234)
      expect(func).to.throw()
    })

    test('throws for undefined', async () => {
      const func = () => validators.assertIsNullableBoolean()
      expect(func).to.throw()
    })
  })

  experiment('.assertNullableEnum', () => {
    test('allows null', async () => {
      const numberEnum = { one: 1, two: 2 }
      expect(() => {
        validators.assertNullableEnum(null, Object.values(numberEnum))
      }).not.to.throw()
    })

    test('allows a value from the defined enum', async () => {
      const numberEnum = { one: 1, two: 2 }
      expect(() => {
        validators.assertNullableEnum(numberEnum.two, Object.values(numberEnum))
      }).not.to.throw()
    })

    test('rejects a value from outside the defined enum', async () => {
      const numberEnum = { one: 1, two: 2 }
      expect(() => {
        validators.assertNullableEnum(1123, Object.values(numberEnum))
      }).to.throw()
    })
  })

  experiment('.assertEmailAddress', () => {
    test('allows a valid email address', async () => {
      expect(() => {
        validators.assertEmailAddress('test@example.com')
      }).not.to.throw()
    })

    test('rejects an invalid email address', async () => {
      expect(() => {
        validators.assertEmailAddress('not.an.email@')
      }).to.throw()
    })

    test('throws for null', async () => {
      expect(() => {
        validators.assertEmailAddress(null)
      }).to.throw()
    })
  })

  experiment('.assertNullableEmailAddress', () => {
    test('allows a valid email address', async () => {
      expect(() => {
        validators.assertNullableEmailAddress('test@example.com')
      }).not.to.throw()
    })

    test('allows null', async () => {
      expect(() => {
        validators.assertNullableEmailAddress(null)
      }).not.to.throw()
    })

    test('rejects an invalid email address', async () => {
      expect(() => {
        validators.assertNullableEmailAddress('not.an.email@')
      }).to.throw()
    })
  })

  experiment('assertQuantity', () => {
    test('allows a positive number', async () => {
      expect(() => {
        validators.assertQuantity(20.75)
      }).not.to.throw()
    })

    test('allows zero', async () => {
      expect(() => {
        validators.assertQuantity(0)
      }).not.to.throw()
    })

    test('allows a number as a string', async () => {
      expect(() => {
        validators.assertQuantity('30.56')
      }).not.to.throw()
    })

    test('throws for a negative number', async () => {
      expect(() => {
        validators.assertQuantity(-2.6)
      }).to.throw()
    })

    test('throws for null', async () => {
      expect(() => {
        validators.assertQuantity(null)
      }).to.throw()
    })

    test('throws for a string', async () => {
      expect(() => {
        validators.assertQuantity('string')
      }).to.throw()
    })
  })

  experiment('assertNullableQuantity', () => {
    test('allows null', async () => {
      expect(() => {
        validators.assertNullableQuantity(null)
      }).not.to.throw()
    })
  })

  experiment('assertNullableQuantityWithMaximum', () => {
    test('allows a number equal to max', async () => {
      expect(() => {
        validators.assertNullableQuantityWithMaximum(35.75, 35.75)
      }).not.to.throw()
    })

    test('throws for a number larger than max', async () => {
      expect(() => {
        validators.assertNullableQuantityWithMaximum(40, 35.75)
      }).to.throw()
    })
  })
})
