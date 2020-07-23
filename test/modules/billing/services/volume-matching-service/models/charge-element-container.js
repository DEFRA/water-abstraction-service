'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const uuid = require('uuid/v4');

const ChargeElementContainer = require('../../../../../../src/modules/billing/services/volume-matching-service/models/charge-element-container');

const AbstractionPeriod = require('../../../../../../src/lib/models/abstraction-period');
const ChargeElement = require('../../../../../../src/lib/models/charge-element');
const BillingVolume = require('../../../../../../src/lib/models/billing-volume');
const DateRange = require('../../../../../../src/lib/models/date-range');
const PurposeUse = require('../../../../../../src/lib/models/purpose-use');
const ReturnLine = require('../../../../../../src/lib/models/return-line');

const createReturnLine = (startDate, endDate) => {
  const line = new ReturnLine();
  line.dateRange = new DateRange(startDate, endDate);
  return line;
};

experiment('modules/billing/services/volume-matching-service/models/charge-element-container', () => {
  let chargeElementContainer, chargeElement, chargePeriod;

  beforeEach(async () => {
    chargePeriod = new DateRange('2019-04-01', '2020-03-31');
    chargeElement = new ChargeElement();
    chargeElement.fromHash({
      id: uuid(),
      authorisedAnnualQuantity: 16.5,
      billableAnnualQuantity: 14.2
    });
    chargeElement.abstractionPeriod = new AbstractionPeriod();
    chargeElement.abstractionPeriod.fromHash({
      startDay: 1,
      startMonth: 5,
      endDay: 30,
      endMonth: 9
    });
    chargeElement.purposeUse = new PurposeUse();
    chargeElement.purposeUse.isTwoPartTariff = true;
    chargeElementContainer = new ChargeElementContainer(chargeElement, chargePeriod);
  });

  experiment('.billingVolume', () => {
    test('model contains a BillingVolume', async () => {
      expect(chargeElementContainer.billingVolume.chargeElementId).to.equal(chargeElement.id);
      expect(chargeElementContainer.billingVolume.isSummer).to.be.true();
    });
  });

  experiment('.chargeElement', () => {
    test('model contains a ChargeElement', async () => {
      expect(chargeElementContainer.chargeElement).to.equal(chargeElement);
    });
  });

  experiment('.abstractionDays', () => {
    test('contains the number of abstraction days', async () => {
      expect(chargeElementContainer.abstractionDays).to.equal(153);
    });
  });

  experiment('.isReturnLineMatch', () => {
    test('returns false if the line is outside the charge period', async () => {
      const line = createReturnLine('2018-05-01', '2018-05-31');
      expect(chargeElementContainer.isReturnLineMatch(line)).to.be.false();
    });

    test('returns false if the line is in the charge period but outside the abs period', async () => {
      const line = createReturnLine('2019-04-01', '2019-04-30');
      expect(chargeElementContainer.isReturnLineMatch(line)).to.be.false();
    });

    test('returns true if the line is in the charge period and overlaps the abs period', async () => {
      const line = createReturnLine('2019-04-15', '2019-05-01');
      expect(chargeElementContainer.isReturnLineMatch(line)).to.be.true();
    });

    experiment('when the element is time-limited', async () => {
      beforeEach(async () => {
        chargeElement.timeLimitedPeriod = new DateRange('2019-06-01', '2025-01-01');
        chargeElementContainer.chargeElement = chargeElement;
      });

      test('returns false if the line is in the charge period and overlaps the abs period but is outside the time-limited period', async () => {
        const line = createReturnLine('2019-05-01', '2019-05-31');
        expect(chargeElementContainer.isReturnLineMatch(line)).to.be.false();
      });

      test('returns true if the line is in the charge period and overlaps the abs period and overlaps the time-limited period', async () => {
        const line = createReturnLine('2019-05-25', '2019-06-01');
        expect(chargeElementContainer.isReturnLineMatch(line)).to.be.true();
      });
    });
  });

  experiment('.isTwoPartTariffPurpose', () => {
    test('returns true if the charge element purpose use is a two-part tariff purpose', async () => {
      expect(chargeElementContainer.isTwoPartTariffPurpose).to.be.true();
    });

    test('returns false if the charge element purpose use is not a two-part tariff purpose', async () => {
      chargeElement.purposeUse.isTwoPartTariff = false;
      expect(chargeElementContainer.isTwoPartTariffPurpose).to.be.false();
    });
  });

  experiment('.isSummer', () => {
    test('returns true if the billing volume is for summer', async () => {
      expect(chargeElementContainer.isSummer).to.be.true();
    });

    test('returns false if the billing volume is for winter/all-year', async () => {
      chargeElementContainer.billingVolume.isSummer = false;
      expect(chargeElementContainer.isSummer).to.be.false();
    });
  });

  experiment('.setTwoPartTariffStatus', () => {
    test('sets the BillingVolume status and billable volume from the charge element', async () => {
      const { ERROR_NO_RETURNS_SUBMITTED } = BillingVolume.twoPartTariffStatuses;
      chargeElementContainer.setTwoPartTariffStatus(ERROR_NO_RETURNS_SUBMITTED);
      expect(chargeElementContainer.billingVolume.twoPartTariffStatus).to.equal(ERROR_NO_RETURNS_SUBMITTED);
      expect(chargeElementContainer.billingVolume.volume).to.equal(chargeElement.volume);
    });
  });

  experiment('.getAvailableVolume', () => {
    test('returns charge element volume when the billing volume is not yet set', async () => {
      expect(chargeElementContainer.getAvailableVolume()).to.equal(14.2);
    });

    test('returns charge element volume - billable volume when the billing volume is set', async () => {
      chargeElementContainer.billingVolume.calculatedVolume = 3;
      expect(chargeElementContainer.getAvailableVolume()).to.equal(11.2);
    });

    test('returns 0 if full volume is already allocated', async () => {
      chargeElementContainer.billingVolume.calculatedVolume = 14.2;
      expect(chargeElementContainer.getAvailableVolume()).to.equal(0);
    });

    test('returns 0 if > full volume is already allocated', async () => {
      chargeElementContainer.billingVolume.calculatedVolume = 25;
      expect(chargeElementContainer.getAvailableVolume()).to.equal(0);
    });
  });
});
