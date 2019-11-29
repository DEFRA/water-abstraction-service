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
});
