'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const chargeElementsService = require('../../../src/lib/services/charge-elements');

const AbstractionPeriod = require('../../../src/lib/models/abstraction-period');
const DateRange = require('../../../src/lib/models/date-range');
const ChargeElement = require('../../../src/lib/models/charge-element');
const LicenceVersion = require('../../../src/lib/models/licence-version');
const LicenceVersionPurpose = require('../../../src/lib/models/licence-version-purpose');
const PurposeUse = require('../../../src/lib/models/purpose-use');

const { CHARGE_SEASON } = require('../../../src/lib/models/constants');

experiment('lib/services/charge-elements', () => {
  experiment('.getChargeElementsFromLicenceVersion', () => {
    let licenceVersionPurpose;
    let licenceVersion;
    let purposeUse;
    let elements;
    let element;
    let abstractionPeriods;

    const setElements = () => {
      purposeUse.isTwoPartTariff = ['400', '420', '600', '620'].includes(purposeUse.code);
      elements = chargeElementsService.getChargeElementsFromLicenceVersion(licenceVersion);
      element = elements[0];
    };

    beforeEach(async () => {
      purposeUse = new PurposeUse(uuid());
      purposeUse.name = 'Vegetable Washing';
      purposeUse.lossFactor = 'low';
      purposeUse.code = '460';

      abstractionPeriods = {
        withinSummer: new AbstractionPeriod(),
        matchingSummer: AbstractionPeriod.getSummer(),
        withinWinter: new AbstractionPeriod(),
        matchingWinter: AbstractionPeriod.getWinter()
      };

      abstractionPeriods.withinSummer.setDates(1, 5, 15, 9);
      abstractionPeriods.withinWinter.setDates(1, 12, 15, 3);

      licenceVersionPurpose = new LicenceVersionPurpose();
      licenceVersionPurpose.abstractionPeriod = abstractionPeriods.withinSummer;

      licenceVersionPurpose.fromHash({
        annualQuantity: 100,
        purposeUse
      });

      licenceVersion = new LicenceVersion();
      licenceVersion.licenceVersionPurposes = [licenceVersionPurpose];

      setElements();
    });

    test('returns an array of charge elements', async () => {
      expect(elements.length).to.equal(1);
      expect(element).to.be.an.instanceOf(ChargeElement);
    });

    test('the charge element source is unsupported', async () => {
      expect(element.source).to.equal('unsupported');
    });

    test('the charge element loss factor is from the purpose use', async () => {
      expect(element.loss).to.equal(purposeUse.lossFactor);
    });

    test('the charge element abstraction period is set', async () => {
      expect(element.abstractionPeriod).to.equal(licenceVersionPurpose.abstractionPeriod);
    });

    test('the charge element authorised annual quantity is taken from the licence version purpose', async () => {
      expect(element.authorisedAnnualQuantity).to.equal(licenceVersionPurpose.annualQuantity);
    });

    test('the billable annual quanity is set to null', async () => {
      expect(element.billableAnnualQuantity).to.equal(null);
    });

    test('the purpose use is set', async () => {
      expect(element.purposeUse).to.equal(purposeUse);
    });

    test('the charge element description is taken from the purpose use name', async () => {
      expect(element.description).to.equal(purposeUse.name);
    });

    test('when there is no time limited dates, the element timelimited period is undefined', async () => {
      expect(element.timeLimitedPeriod).to.equal(undefined);
    });

    test('when there are time limited dates, the element timelimited period is set', async () => {
      const dateRange = new DateRange('2000-01-01', '2000-01-02');
      licenceVersionPurpose.timeLimitedPeriod = dateRange;

      setElements();

      expect(element.timeLimitedPeriod).to.equal(dateRange);
    });

    experiment('season', () => {
      experiment('when the purpose is not irrigation', () => {
        experiment('and the abstraction period sits within the summer bounds', () => {
          test('the season is set to summer', async () => {
            licenceVersionPurpose.abstractionPeriod = abstractionPeriods.withinSummer;
            setElements();

            expect(element.season).to.equal(CHARGE_SEASON.summer);
          });
        });

        experiment('and the abstraction period sits within the winter bounds', () => {
          test('the season is set to winter', async () => {
            licenceVersionPurpose.abstractionPeriod = abstractionPeriods.withinWinter;
            setElements();

            expect(element.season).to.equal(CHARGE_SEASON.winter);
          });
        });

        experiment('and the abstraction period matches the summer bounds', () => {
          test('the season is set to summer', async () => {
            licenceVersionPurpose.abstractionPeriod = abstractionPeriods.matchingSummer;
            setElements();

            expect(element.season).to.equal(CHARGE_SEASON.summer);
          });
        });

        experiment('and the abstraction period matches the winter bounds', () => {
          test('the season is set to winter', async () => {
            licenceVersionPurpose.abstractionPeriod = abstractionPeriods.matchingWinter;
            setElements();

            expect(element.season).to.equal(CHARGE_SEASON.winter);
          });
        });
      });
    });

    experiment('when the purpose is Spray Irrigation - Direct', () => {
      const specs = [
        { period: 'withinSummer', expectedSeason: CHARGE_SEASON.summer },
        { period: 'withinWinter', expectedSeason: CHARGE_SEASON.winter },
        { period: 'matchingSummer', expectedSeason: CHARGE_SEASON.summer },
        { period: 'matchingWinter', expectedSeason: CHARGE_SEASON.winter }
      ];

      specs.forEach(spec => {
        experiment(`and the abstraction period is ${spec.period}`, () => {
          test(`the season is set to ${spec.expectedSeason}`, async () => {
            purposeUse.code = '400';
            licenceVersionPurpose.abstractionPeriod = abstractionPeriods[spec.period];

            setElements();

            expect(element.season).to.equal(spec.expectedSeason);
          });
        });
      });
    });

    experiment('when the purpose is Spray Irrigation - Storage', () => {
      const specs = [
        { period: 'withinSummer', expectedSeason: CHARGE_SEASON.summer },
        { period: 'withinWinter', expectedSeason: CHARGE_SEASON.winter },
        { period: 'matchingSummer', expectedSeason: CHARGE_SEASON.summer },
        { period: 'matchingWinter', expectedSeason: CHARGE_SEASON.winter }
      ];

      specs.forEach(spec => {
        experiment(`and the abstraction period is ${spec.period}`, () => {
          test(`the season is set to ${spec.expectedSeason}`, async () => {
            purposeUse.code = '420';
            licenceVersionPurpose.abstractionPeriod = abstractionPeriods[spec.period];

            setElements();

            expect(element.season).to.equal(spec.expectedSeason);
          });
        });
      });
    });

    experiment('when the purpose is Trickle Irrigation - Direct', () => {
      const specs = [
        { period: 'withinSummer', expectedSeason: CHARGE_SEASON.summer },
        { period: 'withinWinter', expectedSeason: CHARGE_SEASON.winter },
        { period: 'matchingSummer', expectedSeason: CHARGE_SEASON.summer },
        { period: 'matchingWinter', expectedSeason: CHARGE_SEASON.winter }
      ];

      specs.forEach(spec => {
        experiment(`and the abstraction period is ${spec.period}`, () => {
          test(`the season is set to ${spec.expectedSeason}`, async () => {
            purposeUse.code = '600';
            licenceVersionPurpose.abstractionPeriod = abstractionPeriods[spec.period];

            setElements();

            expect(element.season).to.equal(spec.expectedSeason);
          });
        });
      });
    });

    experiment('when the purpose is Trickle Irrigation - Storage', () => {
      const specs = [
        { period: 'withinSummer', expectedSeason: CHARGE_SEASON.summer },
        { period: 'withinWinter', expectedSeason: CHARGE_SEASON.winter },
        { period: 'matchingSummer', expectedSeason: CHARGE_SEASON.summer },
        { period: 'matchingWinter', expectedSeason: CHARGE_SEASON.winter }
      ];

      specs.forEach(spec => {
        experiment(`and the abstraction period is ${spec.period}`, () => {
          test(`the season is set to ${spec.expectedSeason}`, async () => {
            purposeUse.code = '620';
            licenceVersionPurpose.abstractionPeriod = abstractionPeriods[spec.period];

            setElements();

            expect(element.season).to.equal(spec.expectedSeason);
          });
        });
      });
    });

    experiment('when the purpose is Spray Irrigation - Anti Frost', () => {
      const specs = [
        { period: 'withinSummer' },
        { period: 'withinWinter' },
        { period: 'matchingSummer' },
        { period: 'matchingWinter' }
      ];

      specs.forEach(spec => {
        experiment(`and the abstraction period is ${spec.period}`, () => {
          test('the season is set to all year', async () => {
            purposeUse.code = '380';
            licenceVersionPurpose.abstractionPeriod = abstractionPeriods[spec.period];

            setElements();

            expect(element.season).to.equal(CHARGE_SEASON.allYear);
          });
        });
      });
    });
  });
});
