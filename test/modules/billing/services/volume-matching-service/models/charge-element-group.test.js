'use strict'

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const uuid = require('uuid/v4')
const { flatMap } = require('lodash')

const ChargeElementContainer = require('../../../../../../src/modules/billing/services/volume-matching-service/models/charge-element-container')
const ChargeElementGroup = require('../../../../../../src/modules/billing/services/volume-matching-service/models/charge-element-group')

const AbstractionPeriod = require('../../../../../../src/lib/models/abstraction-period')
const ChargeElement = require('../../../../../../src/lib/models/charge-element')
const DateRange = require('../../../../../../src/lib/models/date-range')
const PurposeUse = require('../../../../../../src/lib/models/purpose-use')
const ReturnLine = require('../../../../../../src/lib/models/return-line')
const { RETURN_SEASONS } = require('../../../../../../src/lib/models/constants')
const Return = require('../../../../../../src/lib/models/return')
const BillingVolume = require('../../../../../../src/lib/models/billing-volume')
const ReturnRequirement = require('../../../../../../src/lib/models/return-requirement')
const ReturnRequirementPurpose = require('../../../../../../src/lib/models/return-requirement-purpose')

const {
  ERROR_RETURN_LINE_OVERLAPS_CHARGE_PERIOD,
  ERROR_OVER_ABSTRACTION
} = require('../../../../../../src/lib/models/billing-volume').twoPartTariffStatuses

const createPurposeUse = (name, options = {}) => {
  const purposeUse = new PurposeUse()
  return purposeUse.fromHash({
    id: uuid(),
    isTwoPartTariff: options.isTwoPartTariffPurpose || false,
    name
  })
}

const createChargeElement = (description, options = {}) => {
  const ele = new ChargeElement(uuid())
  ele.fromHash({
    id: uuid(),
    abstractionPeriod: options.isSummer ? AbstractionPeriod.getSummer() : AbstractionPeriod.getWinter(),
    purposeUse: options.purposeUse,
    description,
    authorisedAnnualQuantity: 20,
    billableAnnualQuantity: 10,
    isSection127AgreementEnabled: true
  })
  if (options.isTimeLimited) {
    ele.timeLimitedPeriod = new DateRange('2005-01-01', '2019-05-31')
  }
  return ele
}

const getDescriptions = chargeElementGroup => {
  return chargeElementGroup.chargeElementContainers.map(chargeElementContainer =>
    chargeElementContainer.chargeElement.description
  )
}

const getGroupTwoPartTariffStatuses = chargeElementGroups => {
  const codes = chargeElementGroups.map(chargeElementGroup =>
    chargeElementGroup.chargeElementContainers.map(chargeElementContainer => {
      const isSummer = chargeElementGroup.returnSeason === RETURN_SEASONS.summer
      const billingVolume = chargeElementContainer.billingVolumes.find(
        billingVolume => billingVolume.isSummer === isSummer
      )
      return billingVolume.twoPartTariffStatus
    })
  )
  return flatMap(codes)
}

const getGroupAllocatedVolumes = chargeElementGroup => {
  return chargeElementGroup.chargeElementContainers.map(chargeElementContainer =>
    chargeElementContainer.totalVolume.toNumber()
  )
}

const createReturnRequirement = purposeUses => {
  const returnRequirement = new ReturnRequirement()
  returnRequirement.returnRequirementPurposes = purposeUses.map(purposeUse => {
    const returnRequirementPurpose = new ReturnRequirementPurpose()
    returnRequirementPurpose.purposeUse = purposeUse
    return returnRequirementPurpose
  })
  return returnRequirement
}

experiment('modules/billing/services/volume-matching-service/models/charge-element-group', () => {
  let chargePeriod, purposeUses, chargeElements, chargeElementContainers, chargeElementGroup, ret

  beforeEach(async () => {
    chargePeriod = new DateRange('2019-04-01', '2020-03-31')
    purposeUses = {
      trickleIrrigation: createPurposeUse('trickleIrrigation', { isTwoPartTariffPurpose: true }),
      sprayIrrigation: createPurposeUse('sprayIrrigation', { isTwoPartTariffPurpose: true }),
      vegetableWashing: createPurposeUse('vegetableWashing'),
      wheelWashing: createPurposeUse('wheelWashing')
    }
    chargeElements = [
      createChargeElement('summerTrickle', { isSummer: true, purposeUse: purposeUses.trickleIrrigation }),
      createChargeElement('winterTrickle', { isSummer: false, purposeUse: purposeUses.trickleIrrigation }),
      createChargeElement('timeLimitedSummerTrickle', { isSummer: true, purposeUse: purposeUses.trickleIrrigation, isTimeLimited: true }),
      createChargeElement('summerVegetableWashing', { isSummer: true, purposeUse: purposeUses.vegetableWashing }),
      createChargeElement('winterVegetableWashing', { isSummer: false, purposeUse: purposeUses.vegetableWashing }),
      createChargeElement('summerSpray', { isSummer: true, purposeUse: purposeUses.sprayIrrigation })
    ]
    chargeElementContainers = chargeElements.map(chargeElement => new ChargeElementContainer(chargeElement, chargePeriod))
    chargeElementGroup = new ChargeElementGroup(chargeElementContainers, RETURN_SEASONS.summer)
    ret = new Return()
    ret.fromHash({
      returnRequirement: createReturnRequirement([purposeUses.trickleIrrigation, purposeUses.sprayIrrigation]),
      isSummer: true
    })
  })

  experiment('.constructor', () => {
    test('populates the chargeElementContainers property', async () => {
      expect(chargeElementGroup.chargeElementContainers).to.be.an.array().length(6)
    })
  })

  experiment('.volume', () => {
    test('gets the billable volume of all elements in the group', async () => {
      expect(chargeElementGroup.volume.toNumber()).to.equal(60)
    })
  })

  experiment('.isEmpty', () => {
    test('returns false when there are 1+ chargeElementContainers in the group', async () => {
      expect(chargeElementGroup.isEmpty()).to.be.false()
    })

    test('returns true when there are 0 chargeElementContainers in the group', async () => {
      chargeElementGroup.chargeElementContainers = []
      expect(chargeElementGroup.isEmpty()).to.be.true()
    })
  })

  experiment('.isPurposeUseMatch', () => {
    test('returns true when there are chargeElementContainers in the group matching the supplied purpose use', async () => {
      expect(chargeElementGroup.isPurposeUseMatch(purposeUses.trickleIrrigation)).to.be.true()
      expect(chargeElementGroup.isPurposeUseMatch(purposeUses.vegetableWashing)).to.be.true()
      expect(chargeElementGroup.isPurposeUseMatch(purposeUses.sprayIrrigation)).to.be.true()
    })

    test('returns false when there are no chargeElementContainers in the group matching the supplied purpose use', async () => {
      expect(chargeElementGroup.isPurposeUseMatch(purposeUses.wheelWashing)).to.be.false()
    })
  })

  experiment('.createForTwoPartTariff', () => {
    test('returns a new ChargeElementGroup containing only elements with two-part tariff purpose uses', async () => {
      const newGroup = chargeElementGroup.createForTwoPartTariff()
      expect(getDescriptions(newGroup)).to.equal(['summerTrickle', 'winterTrickle', 'timeLimitedSummerTrickle', 'summerSpray'])
    })
  })

  experiment('.createForReturn', () => {
    test('returns a new ChargeElementGroup containing only elements with purposes uses matching the return', async () => {
      const newGroup = chargeElementGroup.createForReturn(ret)
      expect(getDescriptions(newGroup)).to.equal(['summerTrickle', 'winterTrickle', 'timeLimitedSummerTrickle', 'summerSpray'])
      expect(newGroup.returnSeason).to.equal(RETURN_SEASONS.summer)
    })

    test('the chargeElementGroup returnSeason is winterAllYear if the return.isSummer is false', async () => {
      ret.isSummer = false
      const newGroup = chargeElementGroup.createForReturn(ret)
      expect(newGroup.returnSeason).to.equal(RETURN_SEASONS.winterAllYear)
    })
  })

  experiment('.createForReturnLine', () => {
    beforeEach(async () => {
      chargeElementGroup = chargeElementGroup
        .createForReturn(ret)
    })

    test('returns an array of ChargeElementGroups containing only elements matching the return line date range.  Elements are sorted by: is supported source, abstraction days.  Each group is for 1 purpose.', async () => {
      const returnLine = new ReturnLine()
      returnLine.dateRange = new DateRange('2019-05-01', '2019-05-31')
      const groups = chargeElementGroup.createForReturnLine(returnLine, chargePeriod)

      expect(groups).to.be.an.array().length(2)
      expect(getDescriptions(groups[0])).to.equal(['timeLimitedSummerTrickle', 'summerTrickle'])
      expect(getDescriptions(groups[1])).to.equal(['summerSpray'])
    })

    test('does not include time-limited elements which have expired', async () => {
      const returnLine = new ReturnLine()
      returnLine.dateRange = new DateRange('2019-06-01', '2019-06-30')
      const groups = chargeElementGroup.createForReturnLine(returnLine, chargePeriod)

      expect(groups).to.be.an.array().length(2)
      expect(getDescriptions(groups[0])).to.equal(['summerTrickle'])
      expect(getDescriptions(groups[1])).to.equal(['summerSpray'])
    })

    test('throws an error if there are no matching charge elements', async () => {
      chargeElementGroup.chargeElementContainers = []
      const returnLine = new ReturnLine('00000000-0000-0000-0000-000000000000')
      returnLine.dateRange = new DateRange('2019-06-01', '2019-06-30')

      const func = () => {
        chargeElementGroup.createForReturnLine(returnLine, chargePeriod)
      }

      const err = expect(func).to.throw()
      expect(err.name).to.equal('ChargeElementMatchingError')
      expect(err.message).to.equal('No charge elements to match for return line 00000000-0000-0000-0000-000000000000')
    })

    test('does not flag an error if a return line straddles a charge period on financial year boundary', async () => {
      const returnLine = new ReturnLine('00000000-0000-0000-0000-000000000000')
      returnLine.dateRange = new DateRange('2019-03-29', '2019-04-04')
      const groups = chargeElementGroup.createForReturnLine(returnLine, chargePeriod)
      const twoPartTariffStatuses = getGroupTwoPartTariffStatuses(groups)
      expect(twoPartTariffStatuses).to.only.include(undefined)
    })

    test('flags an error if a return line straddles charge period not on financial year boundary', async () => {
      chargePeriod.startDate = '2019-04-02'
      const returnLine = new ReturnLine('00000000-0000-0000-0000-000000000000')
      returnLine.dateRange = new DateRange('2019-03-29', '2019-04-04')
      const groups = chargeElementGroup.createForReturnLine(returnLine, chargePeriod)

      const twoPartTariffStatuses = getGroupTwoPartTariffStatuses(groups)
      expect(twoPartTariffStatuses).to.only.include(ERROR_RETURN_LINE_OVERLAPS_CHARGE_PERIOD)
    })
  })

  experiment('.setTwoPartTariffStatus', () => {
    test('sets two part tariff status for all elements in group', async () => {
      chargeElementGroup.setTwoPartTariffStatus(ERROR_RETURN_LINE_OVERLAPS_CHARGE_PERIOD)
      const twoPartTariffStatuses = getGroupTwoPartTariffStatuses([chargeElementGroup])
      expect(twoPartTariffStatuses).to.have.length(chargeElementGroup.chargeElementContainers.length)
      expect(twoPartTariffStatuses).to.only.include(ERROR_RETURN_LINE_OVERLAPS_CHARGE_PERIOD)
    })
  })

  experiment('.allocate', () => {
    beforeEach(async () => {
      chargeElementGroup = chargeElementGroup
        .createForReturn(ret)
    })

    test('allocates water starting with first element in group', async () => {
      chargeElementGroup.allocate(5)
      expect(getGroupAllocatedVolumes(chargeElementGroup)).to.equal([5, 0, 0, 0])
    })

    test('allocates water moving on to second element in group', async () => {
      chargeElementGroup.allocate(15)
      expect(getGroupAllocatedVolumes(chargeElementGroup)).to.equal([10, 5, 0, 0])
    })

    test('allocates water moving on to last element in group', async () => {
      chargeElementGroup.allocate(25)
      expect(getGroupAllocatedVolumes(chargeElementGroup)).to.equal([10, 10, 5, 0])
    })

    test('can allocate full billable volume to all elements', async () => {
      chargeElementGroup.allocate(40)
      expect(getGroupAllocatedVolumes(chargeElementGroup)).to.equal([10, 10, 10, 10])
    })

    test('when there is an over-abstraction, the volume is allocated to the last element in the group', async () => {
      chargeElementGroup.allocate(50)
      expect(getGroupAllocatedVolumes(chargeElementGroup)).to.equal([10, 10, 10, 20])
    })
  })

  experiment('.reallocate', () => {
    beforeEach(async () => {
      chargeElements = [
        createChargeElement('timeLimitedSummerTrickle', { isSummer: true, purposeUse: purposeUses.trickleIrrigation, isTimeLimited: true }),
        createChargeElement('summerTrickle', { isSummer: true, purposeUse: purposeUses.trickleIrrigation }),
        createChargeElement('summerVegetableWashing', { isSummer: true, purposeUse: purposeUses.vegetableWashing })
      ]

      chargeElementGroup.chargeElementContainers = chargeElements.map(chargeElement => new ChargeElementContainer(chargeElement, chargePeriod));

      [10, 6, 5].forEach((volume, i) => {
        chargeElementGroup.chargeElementContainers[i].allocate(chargeElementGroup.returnSeason, volume)
      })
    })

    experiment('when the time-limited elements abs period is contained by the base element abs period:', () => {
      test('before re-allocation, the base element is not full', async () => {
        expect(getGroupAllocatedVolumes(chargeElementGroup)).to.equal([10, 6, 5])
      })

      test('aftert re-allocation, the volume is re-allocated to base element with matching source, season and purpose', async () => {
        chargeElementGroup.reallocate()
        expect(getGroupAllocatedVolumes(chargeElementGroup)).to.equal([6, 10, 5])
      })
    })

    experiment('when the time-limited elements abs period is not contained by the base element abs period:', () => {
      beforeEach(async () => {
        chargeElements[0].abstractionPeriod.setDates(1, 1, 31, 12)
      })

      test('before re-allocation, the base element is not full', async () => {
        expect(getGroupAllocatedVolumes(chargeElementGroup)).to.equal([10, 6, 5])
      })

      test('no re-allocation takes place', async () => {
        chargeElementGroup.reallocate()
        expect(getGroupAllocatedVolumes(chargeElementGroup)).to.equal([10, 6, 5])
      })
    })
  })

  experiment('.flagOverAbstraction', () => {
    beforeEach(async () => {
      chargeElements = [
        createChargeElement('timeLimitedSummerTrickle', { isSummer: true, purposeUse: purposeUses.trickleIrrigation, isTimeLimited: true }),
        createChargeElement('summerTrickle', { isSummer: true, purposeUse: purposeUses.trickleIrrigation })
      ]

      chargeElementGroup.chargeElementContainers = chargeElements.map(chargeElement => new ChargeElementContainer(chargeElement, chargePeriod));

      [5, 15].forEach((volume, i) => {
        chargeElementGroup.chargeElementContainers[i].allocate(chargeElementGroup.returnSeason, volume)
      })

      chargeElementGroup.flagOverAbstraction()
    })

    test('only elements with over-abstraction are flagged', async () => {
      const twoPartTariffStatuses = getGroupTwoPartTariffStatuses([chargeElementGroup])
      expect(twoPartTariffStatuses).to.equal([undefined, ERROR_OVER_ABSTRACTION])
    })
  })

  experiment('.toBillingVolumes', () => {
    let billingVolumes

    beforeEach(async () => {
      chargeElements = [
        createChargeElement('timeLimitedSummerTrickle', { isSummer: true, purposeUse: purposeUses.trickleIrrigation, isTimeLimited: true }),
        createChargeElement('summerTrickle', { isSummer: true, purposeUse: purposeUses.trickleIrrigation })
      ]

      chargeElementGroup.chargeElementContainers = chargeElements.map(chargeElement => new ChargeElementContainer(chargeElement, chargePeriod));

      [5, 1 / 3].forEach((volume, i) => {
        chargeElementGroup.chargeElementContainers[i].allocate(chargeElementGroup.returnSeason, volume)
      })

      billingVolumes = chargeElementGroup.toBillingVolumes()
    })

    test('returns an array of BillingVolume models', async () => {
      expect(billingVolumes).to.be.an.array().length(2)
      expect(billingVolumes[0] instanceof BillingVolume).to.be.true()
      expect(billingVolumes[1] instanceof BillingVolume).to.be.true()
    })

    test('billing volumes have been rounded to 6 dp', async () => {
      expect(billingVolumes[0].calculatedVolume.toNumber()).to.equal(5)
      expect(billingVolumes[0].volume).to.equal(5)
      expect(billingVolumes[1].calculatedVolume.toNumber()).to.equal(0.3333333333333333)
      expect(billingVolumes[1].volume).to.equal(0.333333)
    })
  })

  experiment('.setBillingVolumes', () => {
    let billingVolumes

    const createBillingVolume = (chargeElementId, isSummer) => {
      const billingVolume = new BillingVolume(uuid())
      return billingVolume.fromHash({
        chargeElementId,
        isSummer
      })
    }

    beforeEach(async () => {
      chargeElements = [
        createChargeElement('timeLimitedSummerTrickle', { isSummer: true, purposeUse: purposeUses.trickleIrrigation, isTimeLimited: true }),
        createChargeElement('summerTrickle', { isSummer: true, purposeUse: purposeUses.trickleIrrigation })
      ]
      chargeElementGroup.chargeElementContainers = chargeElements.map(chargeElement => new ChargeElementContainer(chargeElement, chargePeriod))

      billingVolumes = [
        createBillingVolume(chargeElements[0].id, true),
        createBillingVolume(chargeElements[0].id, false),
        createBillingVolume(chargeElements[1].id, true),
        createBillingVolume(chargeElements[1].id, false)
      ]
      chargeElementGroup.setBillingVolumes(billingVolumes)
    })

    test('the first charge element has the correct volumes', async () => {
      const [chargeElementContainer] = chargeElementGroup.chargeElementContainers

      expect(chargeElementContainer.getBillingVolume(RETURN_SEASONS.summer).id).to.equal(
        billingVolumes[0].id
      )

      expect(chargeElementContainer.getBillingVolume(RETURN_SEASONS.winterAllYear).id).to.equal(
        billingVolumes[1].id
      )
    })

    test('the second charge element has the correct volumes', async () => {
      const [, chargeElementContainer] = chargeElementGroup.chargeElementContainers

      expect(chargeElementContainer.getBillingVolume(RETURN_SEASONS.summer).id).to.equal(
        billingVolumes[2].id
      )

      expect(chargeElementContainer.getBillingVolume(RETURN_SEASONS.winterAllYear).id).to.equal(
        billingVolumes[3].id
      )
    })
  })
})
