'use strict';

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

// Services
const matchingService = require('../../../../../src/modules/billing/services/volume-matching-service/matching-service');

// Models
const ChargeElementGroup = require('../../../../../src/modules/billing/services/volume-matching-service/models/charge-element-group');
const ReturnGroup = require('../../../../../src/modules/billing/services/volume-matching-service/models/return-group');
const AbstractionPeriod = require('../../../../../src/lib/models/abstraction-period');

const Return = require('../../../../../src/lib/models/return');

const { twoPartTariffStatuses } = require('../../../../../src/lib/models/billing-volume');
const { logger } = require('../../../../../src/logger');

const {
  chargePeriod,
  createReturn,
  createChargeElementContainer,
  createPurposeUse
} = require('./data');
const sandbox = require('sinon').createSandbox();

const purposeUses = {
  sprayIrrigation: createPurposeUse('sprayIrrigation', true),
  trickleIrrigation: createPurposeUse('trickleIrrigation', true)
};

experiment('modules/billing/services/volume-matching-service/matching-service', () => {
  let returnGroup, chargeElementGroup, result;

  beforeEach(async () => {
    sandbox.stub(logger, 'info');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('when a return has errors', () => {
    beforeEach(async () => {
      returnGroup = new ReturnGroup([
        createReturn(AbstractionPeriod.getAllYear(), [purposeUses.sprayIrrigation], false, { status: Return.RETURN_STATUS.due })
      ]);
      chargeElementGroup = new ChargeElementGroup([
        createChargeElementContainer('Spray all year', AbstractionPeriod.getAllYear(), purposeUses.sprayIrrigation)
      ]);
      result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup, true);
    });

    test('the matching is aborted early and error codes assigned', async () => {
      expect(result).to.be.an.array().length(1);
      expect(result[0].volume).to.equal(0);
      expect(result[0].calculatedVolume.toNumber()).to.equal(0);
      expect(result[0].twoPartTariffStatus).to.equal(twoPartTariffStatuses.ERROR_NO_RETURNS_SUBMITTED);
    });
  });

  experiment('for summer returns matching', () => {
    experiment('for a summer return with 1 purpose', () => {
      beforeEach(async () => {
        returnGroup = new ReturnGroup([
          createReturn(AbstractionPeriod.getSummer(), [purposeUses.sprayIrrigation], true)
        ]);
      });

      experiment('for a single all-year element', () => {
        beforeEach(async () => {
          chargeElementGroup = new ChargeElementGroup([
            createChargeElementContainer('Spray all year', AbstractionPeriod.getAllYear(), purposeUses.sprayIrrigation)
          ]);
          result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup, true);
        });

        test('the result is a single billing volume of 7ML because only in-season abstraction is matched', async () => {
          expect(result).to.have.length(1);
          expect(result[0].calculatedVolume.toNumber()).to.equal(7);
        });

        test('there is no over-abstraction', async () => {
          expect(result[0].twoPartTariffStatus).to.be.undefined();
        });

        test('the billingVolumes have the summer flag set', async () => {
          expect(result.map(billingVolume => billingVolume.isSummer)).to.only.include(true);
        });
      });

      experiment('for a summer element', () => {
        beforeEach(async () => {
          chargeElementGroup = new ChargeElementGroup([
            createChargeElementContainer('Spray summer', AbstractionPeriod.getSummer(), purposeUses.sprayIrrigation)
          ]);
          result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup, true);
        });

        test('the result is a single billing volume of 7ML because only in-season abstraction is matched', async () => {
          expect(result).to.have.length(1);
          expect(result[0].calculatedVolume.toNumber()).to.equal(7);
        });

        test('there is no over-abstraction', async () => {
          expect(result[0].twoPartTariffStatus).to.be.undefined();
        });

        test('the billingVolumes have the summer flag set', async () => {
          expect(result.map(billingVolume => billingVolume.isSummer)).to.only.include(true);
        });
      });

      experiment('for a summer element with over-abstraction', () => {
        beforeEach(async () => {
          chargeElementGroup = new ChargeElementGroup([
            createChargeElementContainer('Spray summer', AbstractionPeriod.getSummer(), purposeUses.sprayIrrigation)
          ]);
          returnGroup.returns[0].currentReturnVersion.returnLines[6].volume = 10000;
          result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup, true);
        });

        test('the result is a single billing volume of 16ML because only in-season abstraction is matched', async () => {
          expect(result).to.have.length(1);
          expect(result[0].calculatedVolume.toNumber()).to.equal(16);
        });

        test('over-abstraction is flagged', async () => {
          expect(result[0].twoPartTariffStatus).to.equal(twoPartTariffStatuses.ERROR_OVER_ABSTRACTION);
        });

        test('the billingVolumes have the summer flag set', async () => {
          expect(result.map(billingVolume => billingVolume.isSummer)).to.only.include(true);
        });
      });

      experiment('for a summer and time-limited summer element without over-abstraction', () => {
        beforeEach(async () => {
          chargeElementGroup = new ChargeElementGroup([
            createChargeElementContainer('Spray summer', AbstractionPeriod.getSummer(), purposeUses.sprayIrrigation),
            createChargeElementContainer('Spray summer time-limited', AbstractionPeriod.getSummer(), purposeUses.sprayIrrigation, { isTimeLimited: true })
          ]);
          returnGroup.returns[0].currentReturnVersion.returnLines[6].volume = 10000;
          result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup, true);
        });

        test('the base element is fully abstracted receiving 12ML', async () => {
          expect(result[0].calculatedVolume.toNumber()).to.equal(12);
        });

        test('the time-limited element is not fully abstracted receiving 4ML', async () => {
          expect(result[1].calculatedVolume.toNumber()).to.equal(4);
        });

        test('there is no over-abstraction', async () => {
          expect(result[0].twoPartTariffStatus).to.be.undefined();
          expect(result[1].twoPartTariffStatus).to.be.undefined();
        });

        test('the billingVolumes have the summer flag set', async () => {
          expect(result.map(billingVolume => billingVolume.isSummer)).to.only.include(true);
        });
      });

      experiment('for a summer and time-limited summer element with over-abstraction', () => {
        beforeEach(async () => {
          chargeElementGroup = new ChargeElementGroup([
            createChargeElementContainer('Spray summer', AbstractionPeriod.getSummer(), purposeUses.sprayIrrigation),
            createChargeElementContainer('Spray summer time-limited', AbstractionPeriod.getSummer(), purposeUses.sprayIrrigation, { isTimeLimited: true })
          ]);

          returnGroup.returns[0].currentReturnVersion.returnLines[3].volume = 20000;

          result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup, true);
        });

        test('the base element is over abstracted receiving 14ML', async () => {
          expect(result[0].calculatedVolume.toNumber()).to.equal(14);
        });

        test('the time-limited element is fully abstracted receiving 12ML', async () => {
          expect(result[1].calculatedVolume.toNumber()).to.equal(12);
        });

        test('the over-abstraction is recorded on the base element', async () => {
          expect(result[0].twoPartTariffStatus).to.equal(twoPartTariffStatuses.ERROR_OVER_ABSTRACTION);
          expect(result[1].twoPartTariffStatus).to.be.undefined();
        });

        test('the billingVolumes have the summer flag set', async () => {
          expect(result.map(billingVolume => billingVolume.isSummer)).to.only.include(true);
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

        test('the billingVolumes have the summer flag set', async () => {
          expect(result.map(billingVolume => billingVolume.isSummer)).to.only.include(true);
        });
      });

      experiment('for a summer and winter element', () => {
        beforeEach(async () => {
          chargeElementGroup = new ChargeElementGroup([
            createChargeElementContainer('Spray summer', AbstractionPeriod.getSummer(), purposeUses.sprayIrrigation),
            createChargeElementContainer('Spray winter', AbstractionPeriod.getWinter(), purposeUses.sprayIrrigation)
          ]);
          result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup, true);
        });

        test('matches 7ML to the summer element because only in-season abstraction is matched', async () => {
          expect(result[0].calculatedVolume.toNumber()).to.equal(7);
        });

        test('matches nothing to the winter element because only in-season abstraction is matched', async () => {
          expect(result[1].calculatedVolume.toNumber()).to.equal(0);
        });

        test('there is no over-abstraction', async () => {
          expect(result[0].twoPartTariffStatus).to.be.undefined();
          expect(result[1].twoPartTariffStatus).to.be.undefined();
        });

        test('the billingVolumes have the summer flag set', async () => {
          expect(result.map(billingVolume => billingVolume.isSummer)).to.only.include(true);
        });
      });

      experiment('for a summer and an all-year element', () => {
        beforeEach(async () => {
          chargeElementGroup = new ChargeElementGroup([
            createChargeElementContainer('Spray summer', AbstractionPeriod.getSummer(), purposeUses.sprayIrrigation),
            createChargeElementContainer('Spray all-year', AbstractionPeriod.getAllYear(), purposeUses.sprayIrrigation)
          ]);
        });

        experiment('when the summer element is not fully abstracted', () => {
          beforeEach(async () => {
            result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup, true);
          });

          test('matches 7ML to the summer element because summer elements are prioritised for summer returns', async () => {
            expect(result[0].calculatedVolume.toNumber()).to.equal(7);
          });

          test('matches 0ML to the all-year element', async () => {
            expect(result[1].calculatedVolume.toNumber()).to.equal(0);
          });

          test('there is no over-abstraction', async () => {
            expect(result[0].twoPartTariffStatus).to.be.undefined();
            expect(result[1].twoPartTariffStatus).to.be.undefined();
          });

          test('the billingVolumes have the summer flag set', async () => {
            expect(result.map(billingVolume => billingVolume.isSummer)).to.only.include(true);
          });
        });

        experiment('when the summer element is fully abstracted', () => {
          beforeEach(async () => {
            returnGroup.returns[0].currentReturnVersion.returnLines[6].volume = 10000;
            result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup, true);
          });

          test('matches 12ML to the summer element because summer elements are prioritised for summer returns', async () => {
            expect(result[0].calculatedVolume.toNumber()).to.equal(12);
          });

          test('matches 4ML to the all-year element because the summer elemennt was full', async () => {
            expect(result[1].calculatedVolume.toNumber()).to.equal(4);
          });

          test('there is no over-abstraction', async () => {
            expect(result[0].twoPartTariffStatus).to.be.undefined();
            expect(result[1].twoPartTariffStatus).to.be.undefined();
          });

          test('the billingVolumes have the summer flag set', async () => {
            expect(result.map(billingVolume => billingVolume.isSummer)).to.only.include(true);
          });
        });

        experiment('when the summer element is over-abstracted', () => {
          beforeEach(async () => {
            returnGroup.returns[0].currentReturnVersion.returnLines[6].volume = 20000;
            result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup, true);
          });

          test('matches 12ML to the summer element because summer elements are prioritised for summer returns', async () => {
            expect(result[0].calculatedVolume.toNumber()).to.equal(12);
          });

          test('matches 14ML to the all-year element because the lowest priority element for matching receives the over-abstraction', async () => {
            expect(result[1].calculatedVolume.toNumber()).to.equal(14);
          });

          test('there is over-abstraction on the lowest priority element', async () => {
            expect(result[0].twoPartTariffStatus).to.be.undefined();
            expect(result[1].twoPartTariffStatus).to.equal(twoPartTariffStatuses.ERROR_OVER_ABSTRACTION);
          });

          test('the billingVolumes have the summer flag set', async () => {
            expect(result.map(billingVolume => billingVolume.isSummer)).to.only.include(true);
          });
        });
      });
    });
  });

  experiment('for a summer return with multiple purposes', () => {
    beforeEach(async () => {
      returnGroup = new ReturnGroup([
        createReturn(AbstractionPeriod.getSummer(), [purposeUses.sprayIrrigation, purposeUses.trickleIrrigation], true)
      ]);
    });

    experiment('for summer elements for each purpose', () => {
      beforeEach(async () => {
        chargeElementGroup = new ChargeElementGroup([
          createChargeElementContainer('Spray summer', AbstractionPeriod.getSummer(), purposeUses.sprayIrrigation),
          createChargeElementContainer('Spray trickle', AbstractionPeriod.getSummer(), purposeUses.trickleIrrigation)

        ]);
        result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup, true);
      });

      test('the result is 2x billing volumes of 7ML because only in-season abstraction is matched across the matching purposes', async () => {
        expect(result).to.have.length(2);
        expect(result[0].calculatedVolume.toNumber()).to.equal(3.5);
        expect(result[1].calculatedVolume.toNumber()).to.equal(3.5);
      });

      test('there is no over-abstraction', async () => {
        expect(result[0].twoPartTariffStatus).to.be.undefined();
        expect(result[1].twoPartTariffStatus).to.be.undefined();
      });

      test('the billingVolumes have the summer flag set', async () => {
        expect(result.map(billingVolume => billingVolume.isSummer)).to.only.include(true);
      });
    });
  });

  experiment('for winter/all year returns matching', () => {
    experiment('for a winter return with 1 purpose', () => {
      beforeEach(async () => {
        returnGroup = new ReturnGroup([
          createReturn(AbstractionPeriod.getWinter(), [purposeUses.sprayIrrigation], false)
        ]);
      });

      experiment('for a single all-year element', () => {
        beforeEach(async () => {
          chargeElementGroup = new ChargeElementGroup([
            createChargeElementContainer('Spray all year', AbstractionPeriod.getAllYear(), purposeUses.sprayIrrigation)
          ]);
          result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup, false);
        });

        test('the result is a single billing volume of 5ML because only in-season abstraction is matched', async () => {
          expect(result).to.have.length(1);
          expect(result[0].calculatedVolume.toNumber()).to.equal(5);
        });

        test('there is no over-abstraction', async () => {
          expect(result[0].twoPartTariffStatus).to.be.undefined();
        });

        test('the billingVolumes have the summer flag false', async () => {
          expect(result.map(billingVolume => billingVolume.isSummer)).to.only.include(false);
        });
      });

      experiment('for a summer element', () => {
        beforeEach(async () => {
          chargeElementGroup = new ChargeElementGroup([
            createChargeElementContainer('Spray summer', AbstractionPeriod.getSummer(), purposeUses.sprayIrrigation)
          ]);
        });

        test('an error code is flagged because there are no charge elements matching the return lines', async () => {
          const result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup, false);
          expect(result[0].twoPartTariffStatus).to.equal(twoPartTariffStatuses.ERROR_NO_MATCHING_CHARGE_ELEMENT);
        });
      });

      experiment('for a winter element with over-abstraction', () => {
        beforeEach(async () => {
          chargeElementGroup = new ChargeElementGroup([
            createChargeElementContainer('Spray winter', AbstractionPeriod.getWinter(), purposeUses.sprayIrrigation)
          ]);
          returnGroup.returns[0].currentReturnVersion.returnLines[11].volume = 10000;
          result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup, false);
        });

        test('the result is a single billing volume of 14ML because only in-season abstraction is matched', async () => {
          expect(result).to.have.length(1);
          expect(result[0].calculatedVolume.toNumber()).to.equal(14);
        });

        test('over-abstraction is flagged', async () => {
          expect(result[0].twoPartTariffStatus).to.equal(twoPartTariffStatuses.ERROR_OVER_ABSTRACTION);
        });

        test('the billingVolumes have the summer flag not set', async () => {
          expect(result.map(billingVolume => billingVolume.isSummer)).to.only.include(false);
        });
      });

      experiment('for a summer and winter element', () => {
        beforeEach(async () => {
          chargeElementGroup = new ChargeElementGroup([
            createChargeElementContainer('Spray summer', AbstractionPeriod.getSummer(), purposeUses.sprayIrrigation),
            createChargeElementContainer('Spray winter', AbstractionPeriod.getWinter(), purposeUses.sprayIrrigation)
          ]);
          result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup, false);
        });

        test('matches nothing to the summer element because only in-season abstraction is matched', async () => {
          expect(result[0].calculatedVolume.toNumber()).to.equal(0);
        });

        test('matches 5ML to the winter element because only in-season abstraction is matched', async () => {
          expect(result[1].calculatedVolume.toNumber()).to.equal(5);
        });

        test('there is no over-abstraction', async () => {
          expect(result[0].twoPartTariffStatus).to.be.undefined();
          expect(result[1].twoPartTariffStatus).to.be.undefined();
        });

        test('the billingVolumes have the summer flag not set', async () => {
          expect(result.map(billingVolume => billingVolume.isSummer)).to.only.include(false);
        });
      });
    });

    experiment('for an all-year return with 1 purpose', () => {
      beforeEach(async () => {
        returnGroup = new ReturnGroup([
          createReturn(AbstractionPeriod.getAllYear(), [purposeUses.sprayIrrigation], false)
        ]);
      });

      experiment('for a single all-year element', () => {
        beforeEach(async () => {
          chargeElementGroup = new ChargeElementGroup([
            createChargeElementContainer('Spray all year', AbstractionPeriod.getAllYear(), purposeUses.sprayIrrigation)
          ]);
          result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup, false);
        });

        test('the result is a single billing volume of 12ML', async () => {
          expect(result).to.have.length(1);
          expect(result[0].calculatedVolume.toNumber()).to.equal(12);
        });

        test('there is no over-abstraction', async () => {
          expect(result[0].twoPartTariffStatus).to.be.undefined();
        });

        test('the billingVolumes have the summer flag false', async () => {
          expect(result.map(billingVolume => billingVolume.isSummer)).to.only.include(false);
        });
      });

      experiment('for a summer element', () => {
        beforeEach(async () => {
          chargeElementGroup = new ChargeElementGroup([
            createChargeElementContainer('Spray summer', AbstractionPeriod.getSummer(), purposeUses.sprayIrrigation)
          ]);
        });

        test('an error code is flagged because there are no charge elements matching the return lines', async () => {
          const result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup, false);
          expect(result[0].twoPartTariffStatus).to.equal(twoPartTariffStatuses.ERROR_NO_MATCHING_CHARGE_ELEMENT);
        });
      });

      experiment('for a summer and winter element', () => {
        beforeEach(async () => {
          chargeElementGroup = new ChargeElementGroup([
            createChargeElementContainer('Spray summer', AbstractionPeriod.getSummer(), purposeUses.sprayIrrigation),
            createChargeElementContainer('Spray winter', AbstractionPeriod.getWinter(), purposeUses.sprayIrrigation)
          ]);
          result = matchingService.match(chargePeriod, chargeElementGroup, returnGroup, false);
        });

        test('matches 7ML to the summer element because only in-season abstraction is matched', async () => {
          expect(result[0].calculatedVolume.toNumber()).to.equal(7);
        });

        test('matches 5ML to the winter element because only in-season abstraction is matched', async () => {
          expect(result[1].calculatedVolume.toNumber()).to.equal(5);
        });

        test('there is no over-abstraction', async () => {
          expect(result[0].twoPartTariffStatus).to.be.undefined();
          expect(result[1].twoPartTariffStatus).to.be.undefined();
        });

        test('the billingVolumes have the summer flag not set', async () => {
          expect(result.map(billingVolume => billingVolume.isSummer)).to.only.include(false);
        });
      });
    });
  });
});
