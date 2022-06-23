'use strict'

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const Address = require('../../../src/lib/models/address')

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580'
const TEST_STRING = 'Some string'

experiment('lib/models/address', () => {
  let address

  /**
   * Tests that the property with the given key can be set to a string or null
   * @param {String} key - the property on the address instance
   */
  const testNullableString = key => {
    test('can be set to a string', async () => {
      address[key] = TEST_STRING
      expect(address[key]).to.equal(TEST_STRING)
    })

    test('can be set to null', async () => {
      address[key] = null
      expect(address[key]).to.equal(null)
    })

    test('cannot be set to a number', async () => {
      const func = () => {
        address[key] = 123
      }
      expect(func).to.throw()
    })

    test('cannot be set to an array', async () => {
      const func = () => {
        address[key] = []
      }
      expect(func).to.throw()
    })

    test('cannot be set to an object', async () => {
      const func = () => {
        address[key] = []
      }
      expect(func).to.throw()
    })

    test('cannot be set to undefined', async () => {
      const func = () => {
        address[key] = undefined
      }
      expect(func).to.throw()
    })
  }

  beforeEach(async () => {
    address = new Address()
  })

  experiment('construction', () => {
    test('can include an id', async () => {
      const address = new Address(TEST_GUID)
      expect(address.id).to.equal(TEST_GUID)
    })

    test('can omit the id', async () => {
      const address = new Address()
      expect(address.id).to.be.undefined()
    })
  })

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      address.id = TEST_GUID
      expect(address.id).to.equal(TEST_GUID)
    })

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        address.id = 'hey'
      }
      expect(func).to.throw()
    })
  })

  experiment('.addressLine1', () => {
    testNullableString('addressLine1')
  })

  experiment('.addressLine2', () => {
    testNullableString('addressLine2')
  })

  experiment('.addressLine3', () => {
    testNullableString('addressLine3')
  })

  experiment('.addressLine4', () => {
    testNullableString('addressLine4')
  })

  experiment('.town', () => {
    testNullableString('town')
  })

  experiment('.county', () => {
    testNullableString('county')
  })

  experiment('.postcode', () => {
    testNullableString('postcode')
  })

  experiment('.country', () => {
    testNullableString('country')
  })

  experiment('.toJSON', () => {
    beforeEach(async () => {
      address.id = TEST_GUID
      address.addressLine1 = 'Daisy cottage'
      address.addressLine2 = 'Buttercup lane'
      address.addressLine3 = 'Babbling brook'
      address.addressLine4 = 'Stony hill'
      address.town = 'Testington'
      address.county = 'Testinshire'
      address.postcode = 'TT1 1TT'
      address.country = 'UK'
    })

    test('returns all required properties as plain object', async () => {
      const obj = address.toJSON()
      expect(obj).to.equal({
        id: TEST_GUID,
        addressLine1: 'Daisy cottage',
        addressLine2: 'Buttercup lane',
        addressLine3: 'Babbling brook',
        addressLine4: 'Stony hill',
        town: 'Testington',
        county: 'Testinshire',
        postcode: 'TT1 1TT',
        country: 'UK',
        uprn: null
      })
    })
  })

  experiment('.validate', () => {
    experiment('when the source is not "nald"', () => {
      beforeEach(async () => {
        address.source = Address.ADDRESS_SOURCE.wrls
      })

      test('for a valid address', async () => {
        address.addressLine1 = 'Daisy cottage'
        address.addressLine2 = 'Buttercup lane'
        address.addressLine3 = 'Babbling brook'
        address.addressLine4 = 'Stony hill'
        address.town = 'Testington'
        address.county = 'Testinshire'
        address.postcode = 'TT1 1TT'
        address.country = 'United Kingdom'
        address.uprn = 12345678

        const { error } = address.validate()

        expect(error).to.be.undefined()
      })

      test('for an invalid address', async () => {
        address.addressLine1 = 'Daisy cottage'
        address.addressLine2 = 'Buttercup lane'
        address.addressLine3 = 'Babbling brook'
        address.addressLine4 = 'Stony hill'
        address.town = 'Testington'
        address.county = 'Testinshire'
        address.postcode = 'XXX XXX'
        address.country = 'United Kingdom'
        address.uprn = 12345678

        const { error } = address.validate()
        expect(error).to.not.be.undefined()
      })
    })

    experiment('when the source is "nald"', () => {
      beforeEach(async () => {
        address.source = Address.ADDRESS_SOURCE.nald
      })

      test('validation rules are skipped', async () => {
        address.addressLine1 = 'Daisy cottage'
        address.addressLine2 = 'Buttercup lane'
        address.addressLine3 = 'Babbling brook'
        address.addressLine4 = 'Stony hill'
        address.town = 'Testington'
        address.county = 'Testinshire'
        address.postcode = 'XXX XXX'
        address.country = 'United Kingdom'
        address.uprn = 12345678

        const { error } = address.validate(address)
        expect(error).to.be.undefined()
      })
    })
  })

  experiment('.sortKey', () => {
    beforeEach(async () => {
      address.addressLine1 = '52 Oak Road'
      address.addressLine2 = 'Acorn Park'
      address.addressLine3 = 'Leafy Place'
      address.town = 'Testington'
      address.county = 'Testingshire'
      address.postcode = 'TT1 1TT'
      address.country = 'UK'
    })

    test('generates a key which can be used for sorting addresses', async () => {
      expect(address.sortKey).to.equal('UK_TT1_1TT_TESTINGSHIRE_TESTINGTON_LEAFY_PLACE_ACORN_PARK_0000052_OAK ROAD')
    })
  })
})
