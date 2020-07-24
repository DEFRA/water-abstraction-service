'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const uuid = require('uuid/v4');
const moment = require('moment');

// Services
const matchingService = require('../../../../../src/modules/billing/services/volume-matching-service/matching-service');

// Models
const ChargeElementContainer = require('../../../../../src/modules/billing/services/volume-matching-service/models/charge-element-container');
const ChargeElementGroup = require('../../../../../src/modules/billing/services/volume-matching-service/models/charge-element-group');
const ReturnGroup = require('../../../../../src/modules/billing/services/volume-matching-service/models/return-group');
const PurposeUse = require('../../../../../src/lib/models/purpose-use');
const AbstractionPeriod = require('../../../../../src/lib/models/abstraction-period');

const ChargeElement = require('../../../../../src/lib/models/charge-element');
const Return = require('../../../../../src/lib/models/return');
const ReturnVersion = require('../../../../../src/lib/models/return-version');
const ReturnLine = require('../../../../../src/lib/models/return-line');

const DateRange = require('../../../../../src/lib/models/date-range');
const { twoPartTariffStatuses } = require('../../../../../src/lib/models/billing-volume');

const chargePeriod = new DateRange('2019-04-01', '2020-03-31');
const DATE_FORMAT = 'YYYY-MM-DD';

const createPurposeUse = (name, isTwoPartTariff) => {
  const purposeUse = new PurposeUse(uuid());
  return purposeUse.fromHash({
    name,
    isTwoPartTariff
  });
};

const purposeUses = {
  sprayIrrigation: createPurposeUse('sprayIrrigation', true),
  trickleIrrigation: createPurposeUse('trickleIrrigation', true)
};

/**
 * Create an array of return lines for testing
 * @return {Array<ReturnLine>}
 */
const createReturnLines = () => Array.from({ length: 12 }).reduce((acc, value, i) => {
  const returnLine = new ReturnLine();
  const startDate = moment('2019-04-01').add(i, 'month');
  return [
    ...acc,
    returnLine.fromHash({
      dateRange: new DateRange(startDate.format(DATE_FORMAT), moment(startDate).endOf('month').format(DATE_FORMAT)),
      volume: 1000
    })
  ];
}, []);

/**
 * Create a return for testing
 * @param {AbstractionPeriod} abstractionPeriod
 * @param {Array<PurposeUse>} purposeUses
 */
const createReturn = (abstractionPeriod, purposeUses, isSummer = false, options = {}) => {
  const returnVersion = new ReturnVersion();
  returnVersion.fromHash({
    isCurrentVersion: true,
    returnLines: createReturnLines()
  });

  const ret = new Return();
  return ret.fromHash({
    dateRange: chargePeriod,
    abstractionPeriod,
    purposeUses,
    status: options.status || Return.RETURN_STATUS.completed,
    dueDate: '2020-04-28',
    receivedDate: '2020-04-15',
    returnVersions: [returnVersion],
    isSummer
  });
};

/**
 * Create a charge element container for testing
 * @param {String} description
 * @param {*} options
 */
const createChargeElementContainer = (description, abstractionPeriod, purposeUse, options = {}) => {
  const ele = new ChargeElement(uuid());
  ele.fromHash({
    id: uuid(),
    abstractionPeriod,
    purposeUse,
    description,
    authorisedAnnualQuantity: options.volume || 12
  });
  if (options.isTimeLimited) {
    ele.timeLimitedPeriod = new DateRange('2019-04-01', '2019-09-30');
  }
  return new ChargeElementContainer(ele, chargePeriod);
};

experiment('modules/billing/services/volume-matching-service/matching-service', () => {
  let returnGroup, chargeElementGroup, result;

  experiment('when a return has errors', () => {
    beforeEach(async () => {
      returnGroup = new ReturnGroup([
        createReturn(AbstractionPeriod.getAllYear(), [purposeUses.sprayIrrigation], false, { status: Return.RETURN_STATUS.due })
      ]);
      chargeElementGroup = new ChargeElementGroup([
        createChargeElementContainer('Spray all year', AbstractionPeriod.getAllYear(), purposeUses.sprayIrrigation)
      ]);
      result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup);
    });

    test('the matching is aborted early and error codes assigned', async () => {
      expect(result).to.be.an.array().length(1);
      expect(result[0].calculatedVolume).to.equal(chargeElementGroup.chargeElementContainers[0].chargeElement.volume);
      expect(result[0].twoPartTariffStatus).to.equal(twoPartTariffStatuses.ERROR_NO_RETURNS_SUBMITTED);
    });
  });

  experiment('for an all-year return with 1 purpose', () => {
    beforeEach(async () => {
      returnGroup = new ReturnGroup([
        createReturn(AbstractionPeriod.getAllYear(), [purposeUses.sprayIrrigation])
      ]);
    });

    experiment('for a single all-year element', () => {
      beforeEach(async () => {
        chargeElementGroup = new ChargeElementGroup([
          createChargeElementContainer('Spray all year', AbstractionPeriod.getAllYear(), purposeUses.sprayIrrigation)
        ]);
        result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup);
      });

      test('the result is a single billing volume of 12ML', async () => {
        expect(result).to.have.length(1);
        expect(result[0].calculatedVolume).to.equal(12);
      });

      test('there is no over-abstraction', async () => {
        expect(result[0].twoPartTariffStatus).to.be.undefined();
      });
    });

    experiment('for a summer element', () => {
      beforeEach(async () => {
        chargeElementGroup = new ChargeElementGroup([
          createChargeElementContainer('Spray summer', AbstractionPeriod.getSummer(), purposeUses.sprayIrrigation)
        ]);
      });

      test('throws an error because there are return lines which cannot be matched', async () => {
        const func = () => matchingService.match(chargePeriod, chargeElementGroup, returnGroup);
        expect(func).to.throw();
      });
    });

    experiment('for a winter element', () => {
      beforeEach(async () => {
        chargeElementGroup = new ChargeElementGroup([
          createChargeElementContainer('Spray winter', AbstractionPeriod.getWinter(), purposeUses.sprayIrrigation)
        ]);
      });

      test('throws an error because there are return lines which cannot be matched', async () => {
        const func = () => matchingService.match(chargePeriod, chargeElementGroup, returnGroup);
        expect(func).to.throw();
      });
    });

    experiment('for a summer and winter element', () => {
      beforeEach(async () => {
        chargeElementGroup = new ChargeElementGroup([
          createChargeElementContainer('Spray summer', AbstractionPeriod.getSummer(), purposeUses.sprayIrrigation),
          createChargeElementContainer('Spray winter', AbstractionPeriod.getWinter(), purposeUses.sprayIrrigation)
        ]);
        result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup);
      });

      test('matches 7ML to the summer element', async () => {
        expect(result[0].calculatedVolume).to.equal(7);
      });

      test('matches 5ML to the winter element', async () => {
        expect(result[1].calculatedVolume).to.equal(5);
      });

      test('there is no over-abstraction', async () => {
        expect(result[0].twoPartTariffStatus).to.be.undefined();
        expect(result[1].twoPartTariffStatus).to.be.undefined();
      });
    });

    experiment('for a summer and winter element with over-abstraction in winter', () => {
      beforeEach(async () => {
        chargeElementGroup = new ChargeElementGroup([
          createChargeElementContainer('Spray summer', AbstractionPeriod.getSummer(), purposeUses.sprayIrrigation),
          createChargeElementContainer('Spray winter', AbstractionPeriod.getWinter(), purposeUses.sprayIrrigation, { volume: 5 })
        ]);
        returnGroup.returns[0].currentReturnVersion.returnLines[11].volume = 2000;
        result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup);
      });

      test('matches 7ML to the summer element', async () => {
        expect(result[0].calculatedVolume).to.equal(7);
      });

      test('matches 6ML to the winter element', async () => {
        expect(result[1].calculatedVolume).to.equal(6);
      });

      test('the winter element only is marked as over-abstracted', async () => {
        expect(result[0].twoPartTariffStatus).to.be.undefined();
        expect(result[1].twoPartTariffStatus).to.equal(twoPartTariffStatuses.ERROR_OVER_ABSTRACTION);
      });
    });

    experiment('for an all year element plus a time-limited element', () => {
      beforeEach(async () => {
        chargeElementGroup = new ChargeElementGroup([
          createChargeElementContainer('Spray all year', AbstractionPeriod.getAllYear(), purposeUses.sprayIrrigation),
          createChargeElementContainer('Spray all year ending 2019-09-30', AbstractionPeriod.getAllYear(), purposeUses.sprayIrrigation, { isTimeLimited: true })
        ]);
      });

      experiment('when only the base element is filled', () => {
        beforeEach(async () => {
          result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup);
        });

        test('matches 12ML to the all-year element', async () => {
          expect(result[0].calculatedVolume).to.equal(12);
        });

        test('matches 0ML to the time-limited element', async () => {
          expect(result[1].calculatedVolume).to.equal(0);
        });
      });

      experiment('when there is additional abstraction within the time-limited period', () => {
        beforeEach(async () => {
          const { currentReturnVersion } = returnGroup.returns[0];

          currentReturnVersion.returnLines[0].volume = 2000;
          currentReturnVersion.returnLines[1].volume = 2000;
          currentReturnVersion.returnLines[2].volume = 2000;
          currentReturnVersion.returnLines[3].volume = 2000;
          currentReturnVersion.returnLines[4].volume = 2000;
          currentReturnVersion.returnLines[5].volume = 2000;

          result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup);
        });

        test('matches 12ML to the all-year element', async () => {
          expect(result[0].calculatedVolume).to.equal(12);
        });

        test('matches 6ML to the time-limited', async () => {
          expect(result[1].calculatedVolume).to.equal(6);
        });

        test('there is no over-abstraction', async () => {
          expect(result[0].twoPartTariffStatus).to.be.undefined();
          expect(result[1].twoPartTariffStatus).to.be.undefined();
        });
      });

      experiment('when there is additional abstraction, time-limited element is filled first then rebalanced towards the base element', () => {
        beforeEach(async () => {
          const { currentReturnVersion } = returnGroup.returns[0];

          currentReturnVersion.returnLines[6].volume = 2000;
          currentReturnVersion.returnLines[7].volume = 2000;
          currentReturnVersion.returnLines[8].volume = 2000;
          currentReturnVersion.returnLines[9].volume = 2000;
          currentReturnVersion.returnLines[10].volume = 2000;
          currentReturnVersion.returnLines[11].volume = 2000;

          result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup);
        });

        test('matches 12ML to the all-year element', async () => {
          expect(result[0].calculatedVolume).to.equal(12);
        });

        test('matches 6ML to the time-limited', async () => {
          expect(result[1].calculatedVolume).to.equal(6);
        });

        test('there is no over-abstraction', async () => {
          expect(result[0].twoPartTariffStatus).to.be.undefined();
          expect(result[1].twoPartTariffStatus).to.be.undefined();
        });
      });
    });
  });

  experiment('for an all-year return with 2 purposes', () => {
    beforeEach(async () => {
      returnGroup = new ReturnGroup([
        createReturn(AbstractionPeriod.getAllYear(), [purposeUses.sprayIrrigation, purposeUses.trickleIrrigation])
      ]);
    });

    experiment('for 2 elements, 1 for each purpose', () => {
      beforeEach(async () => {
        chargeElementGroup = new ChargeElementGroup([
          createChargeElementContainer('Spray all year', AbstractionPeriod.getAllYear(), purposeUses.sprayIrrigation),
          createChargeElementContainer('Trickle summer', AbstractionPeriod.getSummer(), purposeUses.trickleIrrigation)
        ]);
        chargeElementGroup.chargeElementContainers[1].chargeElement.authorisedAnnualQuantity = 24;
        result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup);
      });

      test('in the summer months (7ML), 2/3 of the water goes to trickle (based on the ratio of auth quantities for matching elements)', async () => {
        expect(result[1].calculatedVolume).to.equal(4.667);
      });

      test('the rest of the water goes to spray', async () => {
        expect(result[0].calculatedVolume).to.equal(7.333);
      });

      test('there is no over-abstraction', async () => {
        expect(result[0].twoPartTariffStatus).to.be.undefined();
        expect(result[1].twoPartTariffStatus).to.be.undefined();
      });
    });
  });
});
