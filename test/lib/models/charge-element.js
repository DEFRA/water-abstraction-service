'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const ChargeElement = require('../../../src/lib/models/charge-element');
const { CHARGE_SEASON } = require('../../../src/lib/models/constants');
const AbstractionPeriod = require('../../../src/lib/models/abstraction-period');
const PurposeUse = require('../../../src/lib/models/purpose-use');
const ChargePurpose = require('../../../src/lib/models/charge-purpose');
const ChargeCategory = require('../../../src/lib/models/charge-category');
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

  experiment('.eiucSource', () => {
    test('if the source is tidal it returns "tidal"', () => {
      chargeElement.source = 'tidal';
      expect(chargeElement.eiucSource).to.equal('tidal');
    });

    test('if the source is anything else it returns "other"', () => {
      chargeElement.source = 'kielder';
      expect(chargeElement.eiucSource).to.equal('other');
    });
  });

  experiment('.eiucRegion', () => {
    test('if the eiucRegion is set it returns the given value', () => {
      chargeElement.eiucRegion = 'cupcakes';
      expect(chargeElement.eiucRegion).to.equal('cupcakes');
    });

    test('throws an error if set to an invalid value', async () => {
      const func = () => {
        chargeElement.eiucRegion = new TestModel();
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

  experiment('.authorisedAnnualQuantity', () => {
    test('can be set to a float', async () => {
      chargeElement.authorisedAnnualQuantity = 9.3;
      expect(chargeElement.authorisedAnnualQuantity).to.equal(9.3);
    });

    test('a non-numeric value that passes validation is parsed as a float', async () => {
      chargeElement.authorisedAnnualQuantity = '10.2';
      expect(chargeElement.authorisedAnnualQuantity).to.be.a.number().equal(10.2);
    });

    test('throws an error if set to a non-numeric value', () => {
      const func = () => {
        chargeElement.authorisedAnnualQuantity = 'hello';
      };
      expect(func).to.throw();
    });
  });

  experiment('.billableAnnualQuantity', () => {
    test('can be set to a float', async () => {
      chargeElement.billableAnnualQuantity = 9.3;
      expect(chargeElement.billableAnnualQuantity).to.equal(9.3);
    });

    test('a non-numeric value that passes validation is parsed as a float', async () => {
      chargeElement.billableAnnualQuantity = '10.2';
      expect(chargeElement.billableAnnualQuantity).to.be.a.number().equal(10.2);
    });

    test('can be set to null', async () => {
      chargeElement.billableAnnualQuantity = null;
      expect(chargeElement.billableAnnualQuantity).to.be.a.equal(null);
    });

    test('throws an error if set to a non-numeric value', () => {
      const func = () => {
        chargeElement.billableAnnualQuantity = 'hello';
      };
      expect(func).to.throw();
    });
  });

  experiment('.maxAnnualQuantity', () => {
    test('returns billableAnnualQuantity when this is set', async () => {
      chargeElement.billableAnnualQuantity = 9.3;
      expect(chargeElement.maxAnnualQuantity).to.equal(9.3);
    });

    test('returns authorisedAnnualQuantity when this is set', async () => {
      chargeElement.authorisedAnnualQuantity = 10.2;
      expect(chargeElement.maxAnnualQuantity).to.equal(10.2);
    });

    test('returns maximum of authorisedAnnualQuantity and billableAnnualQuantity when both are set', async () => {
      chargeElement.billableAnnualQuantity = 9.3;
      chargeElement.authorisedAnnualQuantity = 10.2;
      expect(chargeElement.maxAnnualQuantity).to.equal(10.2);
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
    test('can be set to a PurposeUse instance', async () => {
      const purpose = new PurposeUse();
      chargeElement.purposeUse = purpose;
      expect(chargeElement.purposeUse).to.equal(purpose);
    });

    test('throws an error if setting to an instance of another model', async () => {
      const period = new AbstractionPeriod();
      const func = () => {
        chargeElement.purposeUse = period;
      };
      expect(func).to.throw();
    });
  });

  experiment('.timeLimitedPeriod', () => {
    test('can be set to a DateRange instance', async () => {
      const timeLimitedPeriod = new DateRange();
      chargeElement.timeLimitedPeriod = timeLimitedPeriod;
      expect(chargeElement.timeLimitedPeriod).to.equal(timeLimitedPeriod);
    });

    test('can be set to null', async () => {
      chargeElement.timeLimitedPeriod = null;
      expect(chargeElement.timeLimitedPeriod).to.be.null();
    });

    test('throws an error if setting to an instance of another model', async () => {
      const period = new AbstractionPeriod();
      const func = () => {
        chargeElement.timeLimitedPeriod = period;
      };
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

    test('the maxAnnualQuantity property is included', async () => {
      chargeElement.billableAnnualQuantity = 1;
      chargeElement.authorisedAnnualQuantity = 2;
      const result = chargeElement.toJSON();
      expect(result.maxAnnualQuantity).to.equal(2);
    });
  });

  experiment('description', () => {
    test('can be set to null', async () => {
      chargeElement.description = null;
      expect(chargeElement.description).to.equal(null);
    });

    test('can be set to a string value', async () => {
      chargeElement.description = 'test';
      expect(chargeElement.description).to.equal('test');
    });

    test('throws an error if set to a number', async () => {
      const func = () => {
        chargeElement.description = 123;
      };
      expect(func).to.throw();
    });
  });

  experiment('.chargeVersionId', () => {
    test('can be set to a guid string', async () => {
      chargeElement.chargeVersionId = TEST_GUID;
      expect(chargeElement.chargeVersionId).to.equal(TEST_GUID);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        chargeElement.chargeVersionId = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.purposePrimary', () => {
    test('can be set to a Purpose instance', async () => {
      const purpose = new Purpose();
      chargeElement.purposePrimary = purpose;
      expect(chargeElement.purposePrimary).to.equal(purpose);
    });

    test('throws an error if setting to an instance of another model', async () => {
      const period = new AbstractionPeriod();
      const func = () => {
        chargeElement.purposePrimary = period;
      };
      expect(func).to.throw();
    });
  });

  experiment('.purposeSecondary', () => {
    test('can be set to a Purpose instance', async () => {
      const purpose = new Purpose();
      chargeElement.purposeSecondary = purpose;
      expect(chargeElement.purposeSecondary).to.equal(purpose);
    });

    test('throws an error if setting to an instance of another model', async () => {
      const period = new AbstractionPeriod();
      const func = () => {
        chargeElement.purposeSecondary = period;
      };
      expect(func).to.throw();
    });
  });

  experiment('.isFactorsOverridden', () => {
    test('can be set to a boolean true', async () => {
      chargeElement.isFactorsOverridden = true;
      expect(chargeElement.isFactorsOverridden).to.equal(true);
    });

    test('can be set to a boolean false', async () => {
      chargeElement.isFactorsOverridden = false;
      expect(chargeElement.isFactorsOverridden).to.equal(false);
    });

    test('throws an error if set to a non-boolean', async () => {
      const func = () => {
        chargeElement.isFactorsOverridden = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.isSection127AgreementEnabled', () => {
    test('defaults to true for a new model', async () => {
      expect(chargeElement.isSection127AgreementEnabled).to.be.true();
    });

    test('can be set to true', async () => {
      chargeElement.isSection127AgreementEnable = true;
      expect(chargeElement.isSection127AgreementEnabled).to.be.true();
    });

    test('can be set to false', async () => {
      chargeElement.isSection127AgreementEnabled = false;
      expect(chargeElement.isSection127AgreementEnabled).to.be.false();
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        chargeElement.isSection127AgreementEnabled = null;
      };
      expect(func).to.throw();
    });
  });

  experiment('.chargePurposes', () => {
    test('can be set to a ChargePurpose instance', async () => {
      const aChargePurpose = new ChargePurpose();
      chargeElement.chargePurposes = [aChargePurpose];
      expect(chargeElement.chargePurposes).to.equal([aChargePurpose]);
    });

    test('throws an error if setting to an instance of another model', async () => {
      const purpose = new AbstractionPeriod();
      const func = () => {
        chargeElement.chargePurposes = purpose;
      };
      expect(func).to.throw();
    });
  });

  experiment('.chargeCategory', () => {
    test('can be set to a ChargeCategory instance', async () => {
      const chargeCategory = new ChargeCategory();
      chargeElement.chargeCategory = chargeCategory;
      expect(chargeElement.chargeCategory).to.equal(chargeCategory);
    });

    test('throws an error if setting to an instance of another model', async () => {
      const chargeCategory = new AbstractionPeriod();
      const func = () => {
        chargeElement.chargeCategory = chargeCategory;
      };
      expect(func).to.throw();
    });
  });

  experiment('.isRestrictedSource', () => {
    test('can be set to a boolean true', async () => {
      chargeElement.isRestrictedSource = true;
      expect(chargeElement.isRestrictedSource).to.equal(true);
    });

    test('can be set to a boolean false', async () => {
      chargeElement.isRestrictedSource = false;
      expect(chargeElement.isRestrictedSource).to.equal(false);
    });

    test('throws an error if set to a non-boolean', async () => {
      const func = () => {
        chargeElement.isRestrictedSource = 'left flange';
      };
      expect(func).to.throw();
    });
  });
});
