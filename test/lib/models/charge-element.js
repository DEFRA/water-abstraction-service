'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const ChargeElement = require('../../../src/lib/models/charge-element');
const { CHARGE_SEASON } = require('../../../src/lib/models/constants');
const AbstractionPeriod = require('../../../src/lib/models/abstraction-period');
const Purpose = require('../../../src/lib/models/purpose');
const DateRange = require('../../../src/lib/models/date-range');

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
    [CHARGE_SEASON.summer, CHARGE_SEASON.winter, CHARGE_SEASON.allYear].forEach(season => {
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

  experiment('.eiucSource', () => {
    test('is "tidal" when source is "tidal"', async () => {
      chargeElement.source = 'tidal';
      expect(chargeElement.eiucSource).to.equal('tidal');
    });

    test('is "other" when source is not "tidal"', async () => {
      chargeElement.source = 'supported';
      expect(chargeElement.eiucSource).to.equal('other');
    });
  });

  experiment('.volume', () => {
    test('is the billableAnnualQuantity if set', async () => {
      chargeElement.authorisedAnnualQuantity = 10.7;
      chargeElement.billableAnnualQuantity = 9.3;
      expect(chargeElement.volume).to.equal(9.3);
    });

    test('is the authorisedQuantity if billableAnnualQuantity is null', async () => {
      chargeElement.authorisedAnnualQuantity = 10.7;
      chargeElement.billableAnnualQuantity = null;
      expect(chargeElement.volume).to.equal(10.7);
    });
  });

  experiment('.purposeUse', () => {
    test('can be set to a Purpose instance', async () => {
      const purpose = new Purpose();
      chargeElement.purposeUse = purpose;
      expect(chargeElement.purposeUse).to.equal(purpose);
    });

    test('throws an error if setting to an instance of another model', async () => {
      const period = new AbstractionPeriod();
      const func = () => { chargeElement.purposeUse = period; };
      expect(func).to.throw();
    });
  });

  experiment('.timeLimitedPeriod', () => {
    test('can be set to a DateRange instance', async () => {
      const timeLimitedPeriod = new DateRange();
      chargeElement.timeLimitedPeriod = timeLimitedPeriod;
      expect(chargeElement.timeLimitedPeriod).to.equal(timeLimitedPeriod);
    });

    test('throws an error if setting to an instance of another model', async () => {
      const period = new AbstractionPeriod();
      const func = () => { chargeElement.timeLimitedPeriod = period; };
      expect(func).to.throw();
    });
  });

  experiment('.toJSON', () => {
    test('result is an object', async () => {
      const result = chargeElement.toJSON();
      expect(result).to.be.an.object();
    });

    test('the eiucSource property is included', async () => {
      chargeElement.source = 'tidal';
      const result = chargeElement.toJSON();
      expect(result.eiucSource).to.equal('tidal');
    });
  });
});
