'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const Address = require('../../../src/lib/models/address');

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580';
const TEST_STRING = 'Some string';

experiment('lib/models/address', () => {
  let address;

  /**
   * Tests that the property with the given key can be set to a string or null
   * @param {String} key - the property on the address instance
   */
  const testNullableString = key => {
    test('can be set to a string', async () => {
      address[key] = TEST_STRING;
      expect(address[key]).to.equal(TEST_STRING);
    });

    test('can be set to null', async () => {
      address[key] = null;
      expect(address[key]).to.equal(null);
    });

    test('cannot be set to a number', async () => {
      const func = () => {
        address[key] = 123;
      };
      expect(func).to.throw();
    });

    test('cannot be set to an array', async () => {
      const func = () => {
        address[key] = [];
      };
      expect(func).to.throw();
    });

    test('cannot be set to an object', async () => {
      const func = () => {
        address[key] = [];
      };
      expect(func).to.throw();
    });

    test('cannot be set to undefined', async () => {
      const func = () => {
        address[key] = undefined;
      };
      expect(func).to.throw();
    });
  };

  beforeEach(async () => {
    address = new Address();
  });

  experiment('construction', () => {
    test('can include an id', async () => {
      const address = new Address(TEST_GUID);
      expect(address.id).to.equal(TEST_GUID);
    });

    test('can omit the id', async () => {
      const address = new Address();
      expect(address.id).to.be.undefined();
    });
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      address.id = TEST_GUID;
      expect(address.id).to.equal(TEST_GUID);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        address.id = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.addressLine1', () => {
    testNullableString('addressLine1');
  });

  experiment('.addressLine2', () => {
    testNullableString('addressLine2');
  });

  experiment('.addressLine3', () => {
    testNullableString('addressLine3');
  });

  experiment('.addressLine4', () => {
    testNullableString('addressLine4');
  });

  experiment('.town', () => {
    testNullableString('town');
  });

  experiment('.county', () => {
    testNullableString('county');
  });

  experiment('.postcode', () => {
    testNullableString('postcode');
  });

  experiment('.country', () => {
    testNullableString('country');
  });

  experiment('.toJSON', () => {
    beforeEach(async () => {
      address.id = TEST_GUID;
      address.addressLine1 = 'Daisy cottage';
      address.addressLine2 = 'Buttercup lane';
      address.addressLine3 = 'Babbling brook';
      address.addressLine4 = 'Stony hill';
      address.town = 'Testington';
      address.county = 'Testinshire';
      address.postcode = 'TT1 1TT';
      address.country = 'UK';
    });

    test('returns all required properties as plain object', async () => {
      const obj = address.toJSON();
      expect(obj).to.equal({
        id: TEST_GUID,
        addressLine1: 'Daisy cottage',
        addressLine2: 'Buttercup lane',
        addressLine3: 'Babbling brook',
        addressLine4: 'Stony hill',
        town: 'Testington',
        county: 'Testinshire',
        postcode: 'TT1 1TT',
        country: 'UK'
      });
    });
  });

  experiment('.isValid', () => {
    beforeEach(async () => {
      delete address.id;
      address.addressLine1 = 'Daisy cottage';
      address.addressLine2 = 'Buttercup lane';
      address.addressLine3 = 'Babbling brook';
      address.addressLine4 = 'Stony hill';
      address.town = 'Testington';
      address.county = 'Testinshire';
      address.postcode = 'TT1 1TT';
      address.country = 'UK';
      address.uprn = 12345678;
    });

    experiment('addressLine1, addressLine2, addressLine3, addressLine4, town, county', () => {
      const keys = ['addressLine1', 'addressLine2', 'addressLine3', 'addressLine4', 'town', 'county'];

      keys.forEach(key => {
        test(`${key}: is optional`, async () => {
          delete address[key];

          const { error } = address.isValid();
          expect(error).to.equal(null);
        });

        test(`${key}: is valid when present`, async () => {
          const { error, value } = address.isValid();
          expect(error).to.equal(null);
          expect(value[key]).to.equal(address[key]);
        });
      });
    });

    test('at least 1 of addressLine2 and addressLine3 are required', async () => {
      address.addressLine2 = null;
      address.addressLine3 = null;
      const { error } = address.isValid();
      expect(error.details[0].message).to.equal('"addressLine2" must be a string');
    });

    test('at least 1 of addressLine4 and town are required', async () => {
      address.addressLine4 = null;
      address.town = null;
      const { error } = address.isValid();
      expect(error.details[0].message).to.equal('"addressLine4" must be a string');
    });

    experiment('country', () => {
      test('is required', async () => {
        address.country = null;
        const { error } = address.isValid();
        expect(error).to.not.equal(null);
      });

      test('is valid when present', async () => {
        const { error, value } = address.isValid();
        expect(error).to.equal(null);
        expect(value.country).to.equal(address.country);
      });
    });

    experiment('uprn', () => {
      test('is optional', async () => {
        address.uprn = null;

        const { error } = address.isValid();
        expect(error).to.equal(null);
      });

      test('cannot be a string', async () => {
        address.uprn = 'abc';

        const { error } = address.isValid();
        expect(error).to.not.equal(null);
      });

      test('is valid when present', async () => {
        const { error, value } = address.isValid();
        expect(error).to.equal(null);
        expect(value.uprn).to.equal(address.uprn);
      });
    });

    experiment('postcode', () => {
      experiment('when the country is not part of the UK', () => {
        beforeEach(async () => {
          address.country = 'France';
        });

        test('the postcode can be omitted', async () => {
          address.postcode = null;
          const { error, value } = address.isValid();
          expect(error).to.equal(null);
          expect(value.postcode).to.equal(null);
        });

        test('a postcode can be supplied', async () => {
          address.postcode = 'TEST';
          const { error, value } = address.isValid();
          expect(error).to.equal(null);
          expect(value.postcode).to.equal('TEST');
        });
      });

      const countries = [
        'United Kingdom',
        'ENGLAND',
        'wales',
        'Scotland',
        'Northern IRELAND',
        'UK',
        'U.K',
        'u.k.'
      ];

      countries.forEach(country => {
        experiment(`when the country is ${country}`, async () => {
          beforeEach(async () => {
            address.country = country;
          });
          test('the postcode is mandatory', async () => {
            address.postcode = null;
            const { error } = address.isValid(address);
            expect(error).to.not.equal(null);
          });

          test('an invalid postcode is rejected', async () => {
            address.postcode = 'nope';
            const { error } = address.isValid(address);
            expect(error).to.not.equal(null);
          });

          test('a valid postcode is trimmed', async () => {
            address.postcode = 'BS98 1TL';
            const { error, value } = address.isValid(address);
            expect(error).to.equal(null);
            expect(value.postcode).to.equal('BS98 1TL');
          });

          test('a postcode can be without spaces', async () => {
            address.postcode = 'BS981TL';
            const { error, value } = address.isValid(address);
            expect(error).to.equal(null);
            expect(value.postcode).to.equal('BS98 1TL');
          });

          test('a postcode will be uppercased', async () => {
            address.postcode = 'bs98 1TL';
            const { error, value } = address.isValid(address);
            expect(error).to.equal(null);
            expect(value.postcode).to.equal('BS98 1TL');
          });
        });
      });
    });
  });
});
