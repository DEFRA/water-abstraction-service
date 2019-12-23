const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const Agreement = require('../../../src/lib/models/agreement');

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580';

experiment('lib/models/agreement', () => {
  let agreement;

  beforeEach(async () => {
    agreement = new Agreement();
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      agreement.id = TEST_GUID;
      expect(agreement.id).to.equal(TEST_GUID);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        agreement.id = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.code', () => {
    test('can be set to a valid code', async () => {
      agreement.code = '127';
      expect(agreement.code).to.equal('127');
    });

    test('cannot be set to an invalid value', async () => {
      const func = () => {
        agreement.code = '1270';
      };
      expect(func).to.throw();
    });

    test('cannot be set to zero', async () => {
      const func = () => {
        agreement.code = 0;
      };
      expect(func).to.throw();
    });

    test('cannot be set to a negative integer', async () => {
      const func = () => {
        agreement.code = -127;
      };
      expect(func).to.throw();
    });
  });
});
