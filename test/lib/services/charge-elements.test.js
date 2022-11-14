'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const { v4: uuid } = require('uuid')
const sandbox = require('sinon').createSandbox()

const chargeElementsService = require('../../../src/lib/services/charge-elements')

const AbstractionPeriod = require('../../../src/lib/models/abstraction-period')
const DateRange = require('../../../src/lib/models/date-range')
const ChargeElement = require('../../../src/lib/models/charge-element')
const ChargeVersion = require('../../../src/lib/models/charge-version')
const LicenceVersion = require('../../../src/lib/models/licence-version')
const LicenceVersionPurpose = require('../../../src/lib/models/licence-version-purpose')
const PurposeUse = require('../../../src/lib/models/purpose-use')
const Purpose = require('../../../src/lib/models/purpose')

const { CHARGE_SEASON } = require('../../../src/lib/models/constants')
const chargeElementRepo = require('../../../src/lib/connectors/repos/charge-elements')

experiment('lib/services/charge-elements', () => {
  beforeEach(async () => {
    sandbox.stub(chargeElementRepo, 'create')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getChargeElementsFromLicenceVersion', () => {
    let licenceVersionPurpose
    let licenceVersion
    let purposeUse
    let elements
    let element
    let abstractionPeriods

    const setElements = () => {
      purposeUse.isTwoPartTariff = ['380', '400', '420', '600', '620'].includes(purposeUse.code)
      elements = chargeElementsService.getChargeElementsFromLicenceVersion(licenceVersion)
      element = elements[0]
    }

    beforeEach(async () => {
      purposeUse = new PurposeUse(uuid())
      purposeUse.name = 'Vegetable Washing'
      purposeUse.lossFactor = 'low'
      purposeUse.code = '460'

      abstractionPeriods = {
        withinSummer: new AbstractionPeriod(),
        matchingSummer: AbstractionPeriod.getSummer(),
        withinWinter: new AbstractionPeriod(),
        matchingWinter: AbstractionPeriod.getWinter()
      }

      abstractionPeriods.withinSummer.setDates(1, 5, 15, 9)
      abstractionPeriods.withinWinter.setDates(1, 12, 15, 3)

      licenceVersionPurpose = new LicenceVersionPurpose()
      licenceVersionPurpose.abstractionPeriod = abstractionPeriods.withinSummer

      licenceVersionPurpose.fromHash({
        annualQuantity: 100.123456789,
        purposePrimary: new Purpose(uuid()),
        purposeSecondary: new Purpose(uuid()),
        purposeUse
      })

      licenceVersion = new LicenceVersion()
      licenceVersion.licenceVersionPurposes = [licenceVersionPurpose]

      setElements()
    })

    test('returns an array of charge elements', async () => {
      expect(elements.length).to.equal(1)
      expect(element).to.be.an.instanceOf(ChargeElement)
    })

    test('the charge element source is unsupported', async () => {
      expect(element.source).to.equal('unsupported')
    })

    test('the charge element loss factor is from the purpose use', async () => {
      expect(element.loss).to.equal(purposeUse.lossFactor)
    })

    test('the charge element abstraction period is set', async () => {
      expect(element.abstractionPeriod).to.equal(licenceVersionPurpose.abstractionPeriod)
    })

    test('the charge element authorised annual quantity is converted to megalitres from the licence version purpose to 6 decimal places', async () => {
      expect(element.authorisedAnnualQuantity).to.equal(0.100123)
    })

    experiment('when the annual quantity is zero', () => {
      beforeEach(() => {
        licenceVersionPurpose.annualQuantity = 0

        licenceVersion = new LicenceVersion()
        licenceVersion.licenceVersionPurposes = [licenceVersionPurpose]

        setElements()
      })

      afterEach(() => sandbox.restore())
      test('the season is set to winter', async () => {
        expect(element.authorisedAnnualQuantity).to.equal(0)
      })
    })

    test('the billable annual quanity is set to null', async () => {
      expect(element.billableAnnualQuantity).to.equal(null)
    })

    test('the purpose use is set', async () => {
      expect(element.purposeUse).to.equal(purposeUse)
    })

    test('the charge element description is taken from the purpose use name', async () => {
      expect(element.description).to.equal(purposeUse.name)
    })

    test('when there is no time limited dates, the element timelimited period is undefined', async () => {
      expect(element.timeLimitedPeriod).to.equal(undefined)
    })

    test('when there are time limited dates, the element timelimited period is set', async () => {
      const dateRange = new DateRange('2000-01-01', '2000-01-02')
      licenceVersionPurpose.timeLimitedPeriod = dateRange

      setElements()

      expect(element.timeLimitedPeriod).to.equal(dateRange)
    })

    experiment('season', () => {
      experiment('when the purpose is not irrigation', () => {
        experiment('and the abstraction period sits within the summer bounds', () => {
          test('the season is set to summer', async () => {
            licenceVersionPurpose.abstractionPeriod = abstractionPeriods.withinSummer
            setElements()

            expect(element.season).to.equal(CHARGE_SEASON.summer)
          })
        })

        experiment('and the abstraction period sits within the winter bounds', () => {
          test('the season is set to winter', async () => {
            licenceVersionPurpose.abstractionPeriod = abstractionPeriods.withinWinter
            setElements()

            expect(element.season).to.equal(CHARGE_SEASON.winter)
          })
        })

        experiment('and the abstraction period matches the summer bounds', () => {
          test('the season is set to summer', async () => {
            licenceVersionPurpose.abstractionPeriod = abstractionPeriods.matchingSummer
            setElements()

            expect(element.season).to.equal(CHARGE_SEASON.summer)
          })
        })

        experiment('and the abstraction period matches the winter bounds', () => {
          test('the season is set to winter', async () => {
            licenceVersionPurpose.abstractionPeriod = abstractionPeriods.matchingWinter
            setElements()

            expect(element.season).to.equal(CHARGE_SEASON.winter)
          })
        })
      })
    })

    experiment('when the purpose is Spray Irrigation - Direct', () => {
      const specs = [
        { period: 'withinSummer', expectedSeason: CHARGE_SEASON.summer },
        { period: 'withinWinter', expectedSeason: CHARGE_SEASON.winter },
        { period: 'matchingSummer', expectedSeason: CHARGE_SEASON.summer },
        { period: 'matchingWinter', expectedSeason: CHARGE_SEASON.winter }
      ]

      specs.forEach(spec => {
        experiment(`and the abstraction period is ${spec.period}`, () => {
          test(`the season is set to ${spec.expectedSeason}`, async () => {
            purposeUse.code = '400'
            licenceVersionPurpose.abstractionPeriod = abstractionPeriods[spec.period]

            setElements()

            expect(element.season).to.equal(spec.expectedSeason)
          })
        })
      })
    })

    experiment('when the purpose is Spray Irrigation - Storage', () => {
      const specs = [
        { period: 'withinSummer', expectedSeason: CHARGE_SEASON.summer },
        { period: 'withinWinter', expectedSeason: CHARGE_SEASON.winter },
        { period: 'matchingSummer', expectedSeason: CHARGE_SEASON.summer },
        { period: 'matchingWinter', expectedSeason: CHARGE_SEASON.winter }
      ]

      specs.forEach(spec => {
        experiment(`and the abstraction period is ${spec.period}`, () => {
          test(`the season is set to ${spec.expectedSeason}`, async () => {
            purposeUse.code = '420'
            licenceVersionPurpose.abstractionPeriod = abstractionPeriods[spec.period]

            setElements()

            expect(element.season).to.equal(spec.expectedSeason)
          })
        })
      })
    })

    experiment('when the purpose is Trickle Irrigation - Direct', () => {
      const specs = [
        { period: 'withinSummer', expectedSeason: CHARGE_SEASON.summer },
        { period: 'withinWinter', expectedSeason: CHARGE_SEASON.winter },
        { period: 'matchingSummer', expectedSeason: CHARGE_SEASON.summer },
        { period: 'matchingWinter', expectedSeason: CHARGE_SEASON.winter }
      ]

      specs.forEach(spec => {
        experiment(`and the abstraction period is ${spec.period}`, () => {
          test(`the season is set to ${spec.expectedSeason}`, async () => {
            purposeUse.code = '600'
            licenceVersionPurpose.abstractionPeriod = abstractionPeriods[spec.period]

            setElements()

            expect(element.season).to.equal(spec.expectedSeason)
          })
        })
      })
    })

    experiment('when the purpose is Trickle Irrigation - Storage', () => {
      const specs = [
        { period: 'withinSummer', expectedSeason: CHARGE_SEASON.summer },
        { period: 'withinWinter', expectedSeason: CHARGE_SEASON.winter },
        { period: 'matchingSummer', expectedSeason: CHARGE_SEASON.summer },
        { period: 'matchingWinter', expectedSeason: CHARGE_SEASON.winter }
      ]

      specs.forEach(spec => {
        experiment(`and the abstraction period is ${spec.period}`, () => {
          test(`the season is set to ${spec.expectedSeason}`, async () => {
            purposeUse.code = '620'
            licenceVersionPurpose.abstractionPeriod = abstractionPeriods[spec.period]

            setElements()

            expect(element.season).to.equal(spec.expectedSeason)
          })
        })
      })
    })

    experiment('when the purpose is Spray Irrigation - Anti Frost', () => {
      const specs = [
        { period: 'withinSummer' },
        { period: 'withinWinter' },
        { period: 'matchingSummer' },
        { period: 'matchingWinter' }
      ]

      specs.forEach(spec => {
        experiment(`and the abstraction period is ${spec.period}`, () => {
          test('the season is set to all year', async () => {
            purposeUse.code = '380'
            licenceVersionPurpose.abstractionPeriod = abstractionPeriods[spec.period]

            setElements()

            expect(element.season).to.equal(CHARGE_SEASON.allYear)
          })
        })
      })
    })
  })

  experiment('.create', () => {
    let result
    const chargeVersion = new ChargeVersion(uuid())
    const chargeElement = new ChargeElement()
    chargeElement.fromHash({
      description: 'test element',
      source: 'supported',
      loss: 'high',
      season: 'summer',
      abstractionPeriod: new AbstractionPeriod(),
      purposePrimary: new Purpose(uuid()),
      purposeSecondary: new Purpose(uuid()),
      purposeUse: new PurposeUse(uuid()),
      scheme: 'alcs'
    })

    beforeEach(async () => {
      chargeElementRepo.create.resolves({
        chargeElementId: uuid()
      })
      result = await chargeElementsService.create(chargeVersion, chargeElement)
    })

    test('the .create() method is called on the repo', async () => {
      const [data] = chargeElementRepo.create.lastCall.args
      expect(data.source).to.equal(chargeElement.source)
      expect(data.season).to.equal(chargeElement.season)
      expect(data.loss).to.equal(chargeElement.loss)
      expect(data.description).to.equal(chargeElement.description)
      expect(data.purposePrimaryId).to.equal(chargeElement.purposePrimary.id)
      expect(data.purposeSecondaryId).to.equal(chargeElement.purposeSecondary.id)
      expect(data.purposeUseId).to.equal(chargeElement.purposeUse.id)
      expect(data.chargeVersionId).to.equal(chargeVersion.id)
    })

    test('resoles with the new charge element', async () => {
      expect(result).to.be.an.instanceOf(ChargeElement)
    })
  })

  experiment('._getIsFactorsOverridden', () => {
    let chargeElement
    beforeEach(() => {
      chargeElement = new ChargeElement()
      const abstractionPeriod = new AbstractionPeriod()
      abstractionPeriod.setDates(1, 4, 31, 10)
      const purposeUse = new PurposeUse(uuid())
      purposeUse.lossFactor = 'high'
      chargeElement.fromHash({
        description: 'test element',
        source: 'unsupported',
        loss: 'high',
        season: 'summer',
        abstractionPeriod,
        purposePrimary: new Purpose(uuid()),
        purposeSecondary: new Purpose(uuid()),
        purposeUse,
        scheme: 'alcs'
      })
    })

    test('returns false if no factors are overridden', () => {
      const result = chargeElementsService._getIsFactorsOverridden(chargeElement)
      expect(result).to.equal(false)
    })

    test('returns true if loss does not match purpose use loss factor', () => {
      chargeElement.loss = 'medium'
      const result = chargeElementsService._getIsFactorsOverridden(chargeElement)
      expect(result).to.equal(true)
    })

    test('returns true if season does not match calculated season', () => {
      chargeElement.season = 'all year'
      const result = chargeElementsService._getIsFactorsOverridden(chargeElement)
      expect(result).to.equal(true)
    })

    test('returns true if source is not "unsupported"', () => {
      chargeElement.source = 'kielder'
      const result = chargeElementsService._getIsFactorsOverridden(chargeElement)
      expect(result).to.equal(true)
    })
  })
})
