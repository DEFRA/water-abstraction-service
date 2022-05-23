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
      agreement.code = 'S127';
      expect(agreement.code).to.equal('S127');
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

  experiment('.factor', () => {
    test('can be set to zero', async () => {
      agreement.factor = 0;
      expect(agreement.factor).to.equal(0);
    });

    test('can be set to 1', async () => {
      agreement.factor = 1;
      expect(agreement.factor).to.equal(1);
    });

    test('can be set to 0.5', async () => {
      agreement.factor = 0.5;
      expect(agreement.factor).to.equal(0.5);
    });

    test('cannot be set < 0', async () => {
      const func = () => {
        agreement.factor = -0.1;
      };
      expect(func).to.throw();
    });

    test('cannot be set > 1', async () => {
      const func = () => {
        agreement.factor = 1.1;
      };
      expect(func).to.throw();
    });

    test('cannot be set to a non-numeric value', async () => {
      const func = () => {
        agreement.factor = 'not-a-number';
      };
      expect(func).to.throw();
    });
  });
});
