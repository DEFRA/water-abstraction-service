'use strict'

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const { v4: uuid } = require('uuid')

const ChargeElementContainer = require('../../../../../../src/modules/billing/services/volume-matching-service/models/charge-element-container')

const AbstractionPeriod = require('../../../../../../src/lib/models/abstraction-period')
const ChargeElement = require('../../../../../../src/lib/models/charge-element')
const BillingVolume = require('../../../../../../src/lib/models/billing-volume')
const DateRange = require('../../../../../../src/lib/models/date-range')
const PurposeUse = require('../../../../../../src/lib/models/purpose-use')
const ReturnLine = require('../../../../../../src/lib/models/return-line')
const { RETURN_SEASONS } = require('../../../../../../src/lib/models/constants')
const { ERROR_OVER_ABSTRACTION } = BillingVolume.twoPartTariffStatuses

const createReturnLine = (startDate, endDate) => {
  const line = new ReturnLine()
  line.dateRange = new DateRange(startDate, endDate)
  return line
}

const getBillingVolume = (chargeElementContainer, isSummer) =>
  chargeElementContainer.billingVolumes.find(billingVolume => billingVolume.isSummer === isSummer)

experiment('modules/billing/services/volume-matching-service/models/charge-element-container', () => {
  let chargeElementContainer, chargeElement, chargePeriod, summerBillingVolume, winterBillingVolume

  beforeEach(async () => {
    chargePeriod = new DateRange('2019-04-01', '2020-03-31')
    chargeElement = new ChargeElement()
    chargeElement.fromHash({
      id: uuid(),
      authorisedAnnualQuantity: 16.5,
      billableAnnualQuantity: 14.2,
      isSection127AgreementEnabled: true
    })
    chargeElement.abstractionPeriod = new AbstractionPeriod()
    chargeElement.abstractionPeriod.fromHash({
      startDay: 1,
      startMonth: 5,
      endDay: 30,
      endMonth: 9
    })
    chargeElement.purposeUse = new PurposeUse()
    chargeElement.purposeUse.isTwoPartTariff = true
    chargeElementContainer = new ChargeElementContainer(chargeElement, chargePeriod)

    summerBillingVolume = getBillingVolume(chargeElementContainer, true)
    winterBillingVolume = getBillingVolume(chargeElementContainer, false)
  })

  experiment('.billingVolumes', () => {
    test('model contains a pair of BillingVolumes - 1 for each return season', async () => {
      const arr = chargeElementContainer.billingVolumes

      expect(arr).to.be.an.array().length(2)

      expect(arr[0]).to.be.instanceOf(BillingVolume)
      expect(arr[0].chargeElementId).to.equal(chargeElement.id)
      expect(arr[0].isSummer).to.be.true()

      expect(arr[1]).to.be.instanceOf(BillingVolume)
      expect(arr[1].chargeElementId).to.equal(chargeElement.id)
      expect(arr[1].isSummer).to.be.false()
    })
  })

  experiment('.chargeElement', () => {
    test('model contains a ChargeElement', async () => {
      expect(chargeElementContainer.chargeElement).to.equal(chargeElement)
    })
  })

  experiment('.abstractionDays', () => {
    test('contains the number of abstraction days', async () => {
      expect(chargeElementContainer.abstractionDays).to.equal(153)
    })

    experiment('when the charge period does not overlap the time-limited period', () => {
      beforeEach(async () => {
        chargeElement.timeLimitedPeriod = new DateRange('2018-01-01', '2018-12-31')
        chargeElementContainer.chargeElement = chargeElement
      })

      test('the number of abstraction days is 0', async () => {
        expect(chargeElementContainer.abstractionDays).to.equal(0)
      })
    })
  })

  experiment('.isReturnLineMatch', () => {
    test('returns false if the line is outside the charge period', async () => {
      const line = createReturnLine('2018-05-01', '2018-05-31')
      expect(chargeElementContainer.isReturnLineMatch(line)).to.be.false()
    })

    test('returns false if the line is in the charge period but outside the abs period', async () => {
      const line = createReturnLine('2019-04-01', '2019-04-30')
      expect(chargeElementContainer.isReturnLineMatch(line)).to.be.false()
    })

    test('returns true if the line is in the charge period and overlaps the abs period', async () => {
      const line = createReturnLine('2019-04-15', '2019-05-01')
      expect(chargeElementContainer.isReturnLineMatch(line)).to.be.true()
    })

    experiment('when the element is time-limited', () => {
      beforeEach(async () => {
        chargeElement.timeLimitedPeriod = new DateRange('2019-06-01', '2025-01-01')
        chargeElementContainer.chargeElement = chargeElement
      })

      test('returns false if the line is in the charge period and overlaps the abs period but is outside the time-limited period', async () => {
        const line = createReturnLine('2019-05-01', '2019-05-31')
        expect(chargeElementContainer.isReturnLineMatch(line)).to.be.false()
      })

      test('returns true if the line is in the charge period and overlaps the abs period and overlaps the time-limited period', async () => {
        const line = createReturnLine('2019-05-25', '2019-06-01')
        expect(chargeElementContainer.isReturnLineMatch(line)).to.be.true()
      })
    })
  })

  experiment('.isTwoPartTariffPurpose', () => {
    test('returns true if the charge element purpose use is a two-part tariff purpose', async () => {
      expect(chargeElementContainer.isTwoPartTariffPurpose).to.be.true()
    })

    test('returns false if the charge element has section 127 agreement disabled', async () => {
      chargeElementContainer.chargeElement.isSection127AgreementEnabled = false
      expect(chargeElementContainer.isTwoPartTariffPurpose).to.be.false()
    })

    test('returns false if the charge element purpose use is not a two-part tariff purpose', async () => {
      chargeElement.purposeUse.isTwoPartTariff = false
      expect(chargeElementContainer.isTwoPartTariffPurpose).to.be.false()
    })
  })

  experiment('.setTwoPartTariffStatus', () => {
    beforeEach(async () => {
      const { ERROR_NO_RETURNS_SUBMITTED } = BillingVolume.twoPartTariffStatuses
      chargeElementContainer.setTwoPartTariffStatus(RETURN_SEASONS.summer, ERROR_NO_RETURNS_SUBMITTED)
    })

    test('sets the BillingVolume status and billable volume from the charge element for the specified season', async () => {
      const { ERROR_NO_RETURNS_SUBMITTED } = BillingVolume.twoPartTariffStatuses
      expect(summerBillingVolume.twoPartTariffStatus).to.equal(ERROR_NO_RETURNS_SUBMITTED)
      expect(summerBillingVolume.volume).to.equal(chargeElement.volume)
    })

    test('does not alter the BillingVolume status and billable volume for the other season', async () => {
      expect(winterBillingVolume.twoPartTariffStatus).to.be.undefined()
    })
  })

  experiment('.getAvailableVolume', () => {
    test('returns charge element volume when the billing volume is not yet set', async () => {
      expect(chargeElementContainer.getAvailableVolume().toNumber()).to.equal(14.2)
    })

    test('returns charge element volume - billable volume when the summer billing volume is set and approved', async () => {
      summerBillingVolume.volume = 3
      summerBillingVolume.isApproved = true
      expect(chargeElementContainer.getAvailableVolume().toNumber()).to.equal(11.2)
    })

    test('returns charge element volume - billable calculatedVolume when the summer billing calculatedVolume is set and not approved', async () => {
      summerBillingVolume.allocate(3)
      expect(chargeElementContainer.getAvailableVolume().toNumber()).to.equal(11.2)
    })

    test('returns charge element volume - billable volume when the winter billing volume is set and approved', async () => {
      winterBillingVolume.volume = 4
      winterBillingVolume.isApproved = true
      expect(chargeElementContainer.getAvailableVolume().toNumber()).to.equal(10.2)
    })

    test('returns charge element volume - billable calculatedVolume when the winter billing volume is set and not approved', async () => {
      winterBillingVolume.allocate(4)
      expect(chargeElementContainer.getAvailableVolume().toNumber()).to.equal(10.2)
    })

    test('returns charge element volume - billable volume when both summer and winter billing volume is set', async () => {
      winterBillingVolume.volume = 4
      winterBillingVolume.isApproved = true
      summerBillingVolume.volume = 3
      summerBillingVolume.isApproved = true

      expect(chargeElementContainer.getAvailableVolume().toNumber()).to.equal(7.2)
    })

    test('returns 0 if full volume is already allocated', async () => {
      winterBillingVolume.allocate(4.1)
      summerBillingVolume.allocate(10.1)
      expect(chargeElementContainer.getAvailableVolume().toNumber()).to.equal(0)
    })

    test('returns 0 if > full volume is already allocated', async () => {
      winterBillingVolume.allocate(25)
      expect(chargeElementContainer.getAvailableVolume().toNumber()).to.equal(0)
    })
  })

  experiment('.flagOverAbstraction', () => {
    experiment('in the summer cycle', () => {
      experiment('if the summer billing volume is not overabstracted', () => {
        beforeEach(async () => {
          summerBillingVolume.volume = 10
          winterBillingVolume.volume = 20
          chargeElementContainer.flagOverAbstraction(RETURN_SEASONS.summer)
        })

        test('the summer billing volume is not flagged as over-abstracted', async () => {
          expect(summerBillingVolume.twoPartTariffStatus).to.be.undefined()
        })

        test('the winter billing volume is not flagged as over-abstracted', async () => {
          expect(winterBillingVolume.twoPartTariffStatus).to.be.undefined()
        })
      })

      experiment('if the summer billing volume is overabstracted', () => {
        beforeEach(async () => {
          summerBillingVolume.allocate(14.3)
          winterBillingVolume.allocate(20)
          chargeElementContainer.flagOverAbstraction(RETURN_SEASONS.summer)
        })

        test('the summer billing volume is flagged as over-abstracted', async () => {
          expect(summerBillingVolume.twoPartTariffStatus).to.equal(ERROR_OVER_ABSTRACTION)
        })

        test('the winter billing volume is not flagged as over-abstracted', async () => {
          expect(winterBillingVolume.twoPartTariffStatus).to.be.undefined()
        })
      })

      experiment('in the winter/all year cycle', () => {
        experiment('if the summer billing volume is not overabstracted and there is no overall over-abstraction', () => {
          beforeEach(async () => {
            summerBillingVolume.allocate(5)
            winterBillingVolume.allocate(5)
            chargeElementContainer.flagOverAbstraction(RETURN_SEASONS.winterAllYear)
          })

          test('the summer billing volume is not flagged as over-abstracted', async () => {
            expect(summerBillingVolume.twoPartTariffStatus).to.be.undefined()
          })

          test('the winter billing volume is not flagged as over-abstracted', async () => {
            expect(winterBillingVolume.twoPartTariffStatus).to.be.undefined()
          })
        })

        experiment('if there is overall over-abstraction', () => {
          beforeEach(async () => {
            summerBillingVolume.allocate(5)
            winterBillingVolume.allocate(10)
            chargeElementContainer.flagOverAbstraction(RETURN_SEASONS.winterAllYear)
          })

          test('the summer billing volume is not flagged as over-abstracted', async () => {
            expect(summerBillingVolume.twoPartTariffStatus).to.be.undefined()
          })

          test('the winter billing volume is not flagged as over-abstracted', async () => {
            expect(winterBillingVolume.twoPartTariffStatus).to.equal(ERROR_OVER_ABSTRACTION)
          })
        })
      })
    })
  })

  experiment('.score', () => {
    experiment('when the return season is summer,', () => {
      test('and the source is unsupported, the season is not summer, the score is the number of abstraction days', async () => {
        chargeElementContainer.chargeElement.source = ChargeElement.sources.unsupported
        chargeElementContainer.chargeElement.abstractionPeriod = AbstractionPeriod.getWinter()

        expect(chargeElementContainer.getScore(RETURN_SEASONS.summer)).to.equal(153)
      })

      test('and the source is supported, the season is not summer, the score is the number of abstraction days - 1000', async () => {
        chargeElementContainer.chargeElement.source = ChargeElement.sources.supported
        chargeElementContainer.chargeElement.abstractionPeriod = AbstractionPeriod.getWinter()
        expect(chargeElementContainer.getScore(RETURN_SEASONS.summer)).to.equal(-847)
      })

      test('and the source is supported, the season is summer, the score is the number of abstraction days - 2000', async () => {
        chargeElementContainer.chargeElement.source = ChargeElement.sources.supported
        chargeElementContainer.chargeElement.abstractionPeriod = AbstractionPeriod.getSummer()
        expect(chargeElementContainer.getScore(RETURN_SEASONS.summer)).to.equal(-1847)
      })
    })

    experiment('when the return season is winter/all year,', () => {
      test('and the source is unsupported, the season is not summer, the score is the number of abstraction days', async () => {
        chargeElementContainer.chargeElement.source = ChargeElement.sources.unsupported
        chargeElementContainer.chargeElement.abstractionPeriod = AbstractionPeriod.getWinter()

        expect(chargeElementContainer.getScore(RETURN_SEASONS.winterAllYear)).to.equal(153)
      })

      test('and the source is supported, the season is not summer, the score is the number of abstraction days - 1000', async () => {
        chargeElementContainer.chargeElement.source = ChargeElement.sources.supported
        chargeElementContainer.chargeElement.abstractionPeriod = AbstractionPeriod.getWinter()
        expect(chargeElementContainer.getScore(RETURN_SEASONS.winterAllYear)).to.equal(-847)
      })

      test('and the source is supported, the season is summer, the score is the number of abstraction days - 1000', async () => {
        chargeElementContainer.chargeElement.source = ChargeElement.sources.supported
        chargeElementContainer.chargeElement.abstractionPeriod = AbstractionPeriod.getSummer()
        expect(chargeElementContainer.getScore(RETURN_SEASONS.winterAllYear)).to.equal(-847)
      })
    })
  })

  experiment('.setBillingVolume', () => {
    experiment('for a summer billing volume', () => {
      const billingVolume = new BillingVolume(uuid())
      billingVolume.isSummer = true

      beforeEach(async () => {
        chargeElementContainer.setBillingVolume(billingVolume)
      })

      test('the summer billing volume is set', async () => {
        expect(chargeElementContainer.getBillingVolume(RETURN_SEASONS.summer)).to.equal(billingVolume)
        expect(chargeElementContainer.getBillingVolume(RETURN_SEASONS.winterAllYear)).to.not.equal(billingVolume)
      })
    })

    experiment('for a winter/all year billing volume', () => {
      const billingVolume = new BillingVolume(uuid())
      billingVolume.isSummer = false

      beforeEach(async () => {
        chargeElementContainer.setBillingVolume(billingVolume)
      })

      test('the summer billing volume is set', async () => {
        expect(chargeElementContainer.getBillingVolume(RETURN_SEASONS.summer)).to.not.equal(billingVolume)
        expect(chargeElementContainer.getBillingVolume(RETURN_SEASONS.winterAllYear)).to.equal(billingVolume)
      })
    })
  })
})
