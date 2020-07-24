'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const uuid = require('uuid/v4');
const { pullAt } = require('lodash');

const ChargeElementContainer = require('../../../../../../src/modules/billing/services/volume-matching-service/models/charge-element-container');
const ChargeElementGroup = require('../../../../../../src/modules/billing/services/volume-matching-service/models/charge-element-group');

const AbstractionPeriod = require('../../../../../../src/lib/models/abstraction-period');
const ChargeElement = require('../../../../../../src/lib/models/charge-element');
const DateRange = require('../../../../../../src/lib/models/date-range');
const PurposeUse = require('../../../../../../src/lib/models/purpose-use');
const ReturnLine = require('../../../../../../src/lib/models/return-line');
const { RETURN_SEASONS } = require('../../../../../../src/lib/models/constants');
const Return = require('../../../../../../src/lib/models/return');

const createPurposeUse = (name, options = {}) => {
  const purposeUse = new PurposeUse();
  return purposeUse.fromHash({
    id: uuid(),
    isTwoPartTariff: options.isTwoPartTariffPurpose || false,
    name
  });
};

const createChargeElement = (description, options = {}) => {
  const ele = new ChargeElement(uuid());
  ele.fromHash({
    id: uuid(),
    abstractionPeriod: options.isSummer ? AbstractionPeriod.getSummer() : AbstractionPeriod.getWinter(),
    purposeUse: options.purposeUse,
    description,
    authorisedAnnualQuantity: 20,
    billableAnnualQuantity: 10
  });
  if (options.isTimeLimited) {
    ele.timeLimitedPeriod = new DateRange('2005-01-01', '2019-05-31');
  }
  return ele;
};

const getDescriptions = chargeElementGroup => {
  return chargeElementGroup.chargeElementContainers.map(chargeElementContainer =>
    chargeElementContainer.chargeElement.description
  );
};

experiment('modules/billing/services/volume-matching-service/models/charge-element-group', () => {
  let chargePeriod, purposeUses, chargeElements, chargeElementContainers, chargeElementGroup, ret;

  beforeEach(async () => {
    chargePeriod = new DateRange('2019-04-01', '2020-03-31');
    purposeUses = {
      trickleIrrigation: createPurposeUse('trickleIrrigation', { isTwoPartTariffPurpose: true }),
      sprayIrrigation: createPurposeUse('sprayIrrigation', { isTwoPartTariffPurpose: true }),
      vegetableWashing: createPurposeUse('vegetableWashing'),
      wheelWashing: createPurposeUse('wheelWashing')
    };
    chargeElements = [
      createChargeElement('summerTrickle', { isSummer: true, purposeUse: purposeUses.trickleIrrigation }),
      createChargeElement('winterTrickle', { isSummer: false, purposeUse: purposeUses.trickleIrrigation }),
      createChargeElement('timeLimitedSummerTrickle', { isSummer: true, purposeUse: purposeUses.trickleIrrigation, isTimeLimited: true }),
      createChargeElement('summerVegetableWashing', { isSummer: true, purposeUse: purposeUses.vegetableWashing }),
      createChargeElement('winterVegetableWashing', { isSummer: false, purposeUse: purposeUses.vegetableWashing }),
      createChargeElement('summerSpray', { isSummer: true, purposeUse: purposeUses.sprayIrrigation })
    ];
    chargeElementContainers = chargeElements.map(chargeElement => new ChargeElementContainer(chargeElement, chargePeriod));
    chargeElementGroup = new ChargeElementGroup(chargeElementContainers);
    ret = new Return();
    ret.fromHash({
      purposeUses: [purposeUses.trickleIrrigation, purposeUses.sprayIrrigation],
      isSummer: true
    });
  });

  experiment('.constructor', () => {
    test('populates the chargeElementContainers property', async () => {
      expect(chargeElementGroup.chargeElementContainers).to.be.an.array().length(6);
    });
  });

  experiment('.volume', () => {
    test('gets the billable volume of all elements in the group', async () => {
      expect(chargeElementGroup.volume).to.equal(60);
    });
  });

  experiment('.isSummerElements', () => {
    test('returns true when there are charge elements with a summer abs period in the group', async () => {
      expect(chargeElementGroup.isSummerElements()).to.be.true();
    });

    test('returns false when there are charge elements with a summer abs period in the group', async () => {
      pullAt(chargeElementGroup.chargeElementContainers, [0, 2, 3, 5]);
      expect(chargeElementGroup.isSummerElements()).to.be.false();
    });
  });

  experiment('.isEmpty', () => {
    test('returns false when there are 1+ chargeElementContainers in the group', async () => {
      expect(chargeElementGroup.isEmpty()).to.be.false();
    });

    test('returns true when there are 0 chargeElementContainers in the group', async () => {
      chargeElementGroup.chargeElementContainers = [];
      expect(chargeElementGroup.isEmpty()).to.be.true();
    });
  });

  experiment('.isPurposeUseMatch', () => {
    test('returns true when there are chargeElementContainers in the group matching the supplied purpose use', async () => {
      expect(chargeElementGroup.isPurposeUseMatch(purposeUses.trickleIrrigation)).to.be.true();
      expect(chargeElementGroup.isPurposeUseMatch(purposeUses.vegetableWashing)).to.be.true();
      expect(chargeElementGroup.isPurposeUseMatch(purposeUses.sprayIrrigation)).to.be.true();
    });

    test('returns false when there are no chargeElementContainers in the group matching the supplied purpose use', async () => {
      expect(chargeElementGroup.isPurposeUseMatch(purposeUses.wheelWashing)).to.be.false();
    });
  });

  experiment('.createForTwoPartTariff', () => {
    test('returns a new ChargeElementGroup containing only elements with two-part tariff purpose uses', async () => {
      const newGroup = chargeElementGroup.createForTwoPartTariff();
      expect(getDescriptions(newGroup)).to.equal(['summerTrickle', 'winterTrickle', 'timeLimitedSummerTrickle', 'summerSpray']);
    });
  });

  experiment('.createForSeason', () => {
    test('returns a new ChargeElementGroup containing only summer elements when "summer" is passed in', async () => {
      const newGroup = chargeElementGroup.createForSeason(RETURN_SEASONS.summer);
      expect(getDescriptions(newGroup)).to.equal(['summerTrickle', 'timeLimitedSummerTrickle', 'summerVegetableWashing', 'summerSpray']);
    });

    test('returns a new ChargeElementGroup containing only winter/all-year elements when "winterAllYear" is passed in', async () => {
      const newGroup = chargeElementGroup.createForSeason(RETURN_SEASONS.winterAllYear);
      expect(getDescriptions(newGroup)).to.equal(['winterTrickle', 'winterVegetableWashing']);
    });
  });

  experiment('.createForReturn', () => {
    test('returns a new ChargeElementGroup containing only elements with purposes uses matching the return', async () => {
      const newGroup = chargeElementGroup.createForReturn(ret);
      expect(getDescriptions(newGroup)).to.equal(['summerTrickle', 'winterTrickle', 'timeLimitedSummerTrickle', 'summerSpray']);
    });
  });

  experiment('.createForReturnLine', () => {
    beforeEach(async () => {
      chargeElementGroup = chargeElementGroup
        .createForSeason(RETURN_SEASONS.summer)
        .createForReturn(ret);
    });

    test('returns an array of ChargeElementGroups containing only elements matching the return line date range.  Elements are sorted by: is supported source, abstraction days.  Each group is for 1 purpose.', async () => {
      const returnLine = new ReturnLine();
      returnLine.dateRange = new DateRange('2019-05-01', '2019-05-31');
      const groups = chargeElementGroup.createForReturnLine(returnLine, chargePeriod);

      expect(groups).to.be.an.array().length(2);
      expect(getDescriptions(groups[0])).to.equal(['timeLimitedSummerTrickle', 'summerTrickle']);
      expect(getDescriptions(groups[1])).to.equal(['summerSpray']);
    });

    test('does not include time-limited elements which have expired', async () => {
      const returnLine = new ReturnLine();
      returnLine.dateRange = new DateRange('2019-06-01', '2019-06-30');
      const groups = chargeElementGroup.createForReturnLine(returnLine, chargePeriod);

      expect(groups).to.be.an.array().length(2);
      expect(getDescriptions(groups[0])).to.equal(['summerTrickle']);
      expect(getDescriptions(groups[1])).to.equal(['summerSpray']);
    });

    test('throws an error if there are no matching charge elements', async () => {
      chargeElementGroup.chargeElementContainers = [];
      const returnLine = new ReturnLine('00000000-0000-0000-0000-000000000000');
      returnLine.dateRange = new DateRange('2019-06-01', '2019-06-30');

      const func = () => {
        chargeElementGroup.createForReturnLine(returnLine, chargePeriod);
      };

      const err = expect(func).to.throw();
      expect(err.name).to.equal('ChargeElementMatchingError');
      expect(err.message).to.equal('No charge elements to match for return line 00000000-0000-0000-0000-000000000000');
    });
  });
});
