const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const ChargeElement = require('../../../src/lib/models/charge-element');
const AbstractionPeriod = require('../../../src/lib/models/abstraction-period');

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580';

class TestModel {};

experiment('lib/models/charge-element', () => {
  let chargeElement;

  beforeEach(async () => {
    chargeElement = new ChargeElement();
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      chargeElement.id = TEST_GUID;
      expect(chargeElement.id).to.equal(TEST_GUID);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        chargeElement.id = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.source', () => {
    ['supported', 'unsupported', 'tidal', 'kielder'].forEach(source => {
      test(`can be set to ${source}`, async () => {
        chargeElement.source = source;
        expect(chargeElement.source).to.equal(source);
      });
    });

    test('throws an error if set to an invalid source', async () => {
      const func = () => {
        chargeElement.source = 'muddy puddle';
      };
      expect(func).to.throw();
    });
  });

  experiment('.season', () => {
    ['summer', 'winter', 'all year'].forEach(season => {
      test(`can be set to ${season}`, async () => {
        chargeElement.season = season;
        expect(chargeElement.season).to.equal(season);
      });
    });

    test('throws an error if set to an invalid season', async () => {
      const func = () => {
        chargeElement.season = 'yule';
      };
      expect(func).to.throw();
    });
  });

  experiment('.loss', () => {
    ['high', 'medium', 'low', 'very low', 'non-chargeable'].forEach(loss => {
      test(`can be set to ${loss}`, async () => {
        chargeElement.loss = loss;
        expect(chargeElement.loss).to.equal(loss);
      });
    });

    test('throws an error if set to an invalid loss', async () => {
      const func = () => {
        chargeElement.loss = 'somewhere between high and low';
      };
      expect(func).to.throw();
    });
  });

  experiment('.abstractionPeriod', () => {
    test('can be set to an AbstractionPeriod instance', async () => {
      const absPeriod = new AbstractionPeriod();
      chargeElement.abstractionPeriod = absPeriod;
      expect(chargeElement.abstractionPeriod).to.equal(absPeriod);
    });

    test('throws an error if set to another type', async () => {
      const func = () => {
        chargeElement.abstractionPeriod = new TestModel();
      };
      expect(func).to.throw();
    });
  });
});
