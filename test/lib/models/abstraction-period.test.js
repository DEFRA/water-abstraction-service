const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const AbstractionPeriod = require('../../../src/lib/models/abstraction-period')
const DateRange = require('../../../src/lib/models/date-range')

const { CHARGE_SEASON } = require('../../../src/lib/models/constants')

experiment('lib/models/abstraction-period', () => {
  let abstractionPeriod

  beforeEach(async () => {
    abstractionPeriod = new AbstractionPeriod()
  })

  experiment('.startDay', () => {
    test('can be set to a number between 1-31', async () => {
      abstractionPeriod.startDay = 5
      expect(abstractionPeriod.startDay).to.equal(5)
    })

    test('throws an error if set <1', async () => {
      const func = () => {
        abstractionPeriod.startDay = 0
      }
      expect(func).to.throw()
    })

    test('throws an error if set to a non-integer', async () => {
      const func = () => {
        abstractionPeriod.startDay = 12.5
      }
      expect(func).to.throw()
    })

    test('throws an error if set to a non-number', async () => {
      const func = () => {
        abstractionPeriod.startDay = 'not-a-number'
      }
      expect(func).to.throw()
    })

    test('throws an error if set >31', async () => {
      const func = () => {
        abstractionPeriod.startDay = 32
      }
      expect(func).to.throw()
    })
  })

  experiment('.startMonth', () => {
    test('can be set to a number between 1-12', async () => {
      abstractionPeriod.startMonth = 5
      expect(abstractionPeriod.startMonth).to.equal(5)
    })

    test('throws an error if set <1', async () => {
      const func = () => {
        abstractionPeriod.startMonth = 0
      }
      expect(func).to.throw()
    })

    test('throws an error if set to a non-integer', async () => {
      const func = () => {
        abstractionPeriod.startMonth = 5.5
      }
      expect(func).to.throw()
    })

    test('throws an error if set to a non-number', async () => {
      const func = () => {
        abstractionPeriod.startMonth = 'not-a-number'
      }
      expect(func).to.throw()
    })

    test('throws an error if set >12', async () => {
      const func = () => {
        abstractionPeriod.startMonth = 13
      }
      expect(func).to.throw()
    })
  })

  experiment('.endDay', () => {
    test('can be set to a number between 1-31', async () => {
      abstractionPeriod.endDay = 5
      expect(abstractionPeriod.endDay).to.equal(5)
    })

    test('throws an error if set <1', async () => {
      const func = () => {
        abstractionPeriod.endDay = 0
      }
      expect(func).to.throw()
    })

    test('throws an error if set to a non-integer', async () => {
      const func = () => {
        abstractionPeriod.endDay = 12.5
      }
      expect(func).to.throw()
    })

    test('throws an error if set to a non-number', async () => {
      const func = () => {
        abstractionPeriod.endDay = 'not-a-number'
      }
      expect(func).to.throw()
    })

    test('throws an error if set >31', async () => {
      const func = () => {
        abstractionPeriod.endDay = 32
      }
      expect(func).to.throw()
    })
  })

  experiment('.endMonth', () => {
    test('can be set to a number between 1-12', async () => {
      abstractionPeriod.endMonth = 5
      expect(abstractionPeriod.endMonth).to.equal(5)
    })

    test('throws an error if set <1', async () => {
      const func = () => {
        abstractionPeriod.endMonth = 0
      }
      expect(func).to.throw()
    })

    test('throws an error if set to a non-integer', async () => {
      const func = () => {
        abstractionPeriod.endMonth = 5.5
      }
      expect(func).to.throw()
    })

    test('throws an error if set to a non-number', async () => {
      const func = () => {
        abstractionPeriod.endMonth = 'not-a-number'
      }
      expect(func).to.throw()
    })

    test('throws an error if set >12', async () => {
      const func = () => {
        abstractionPeriod.endMonth = 13
      }
      expect(func).to.throw()
    })
  })

  experiment('.setDates()', () => {
    test('sets the dates to the expected values', async () => {
      abstractionPeriod.setDates(1, 2, 3, 4)
      expect(abstractionPeriod.startDay).to.equal(1)
      expect(abstractionPeriod.startMonth).to.equal(2)
      expect(abstractionPeriod.endDay).to.equal(3)
      expect(abstractionPeriod.endMonth).to.equal(4)
    })
  })

  experiment('.isWithinAbstractionPeriod', () => {
    experiment('when the abstraction period is in the same year', () => {
      test('returns true if the start dates are the same', async () => {
        const summer = AbstractionPeriod.getSummer()

        const period = new AbstractionPeriod()
        period.setDates(1, 4, 1, 10)

        expect(period.isWithinAbstractionPeriod(summer)).to.equal(true)
      })

      test('returns true if the end dates are the same', async () => {
        const summer = AbstractionPeriod.getSummer()

        const period = new AbstractionPeriod()
        period.setDates(1, 5, 31, 10)

        expect(period.isWithinAbstractionPeriod(summer)).to.equal(true)
      })

      test('returns true if both start and end dates are the same', async () => {
        const summer = AbstractionPeriod.getSummer()
        const period = AbstractionPeriod.getSummer()

        expect(period.isWithinAbstractionPeriod(summer)).to.equal(true)
      })

      test('returns true if both dates are in between the period', async () => {
        const summer = AbstractionPeriod.getSummer()

        const period = new AbstractionPeriod()
        period.setDates(1, 5, 1, 6)

        expect(period.isWithinAbstractionPeriod(summer)).to.equal(true)
      })

      test('return false if the start date is before the range', async () => {
        const summer = AbstractionPeriod.getSummer()
        const beforeSummer = AbstractionPeriod.getSummer()
        beforeSummer.startMonth = summer.startMonth - 1

        expect(beforeSummer.isWithinAbstractionPeriod(summer)).to.equal(false)
      })

      test('return false if the end date is after the range', async () => {
        const summer = AbstractionPeriod.getSummer()
        const afterSummer = AbstractionPeriod.getSummer()
        afterSummer.endMonth = summer.endMonth + 1

        expect(afterSummer.isWithinAbstractionPeriod(summer)).to.equal(false)
      })

      test('return false if the start and end dates are outside the range', async () => {
        const summer = AbstractionPeriod.getSummer()
        const notSummer = AbstractionPeriod.getSummer()
        notSummer.startMonth = summer.startMonth - 1
        notSummer.endMonth = summer.endMonth + 1

        expect(notSummer.isWithinAbstractionPeriod(summer)).to.equal(false)
      })
    })

    experiment('when the abstraction period spans two years', () => {
      test('returns true if the start dates are the same', async () => {
        const winter = AbstractionPeriod.getWinter()

        const period = new AbstractionPeriod()
        period.setDates(1, 11, 1, 3)

        expect(period.isWithinAbstractionPeriod(winter)).to.equal(true)
      })

      test('returns true if the end dates are the same', async () => {
        const winter = AbstractionPeriod.getWinter()

        const period = new AbstractionPeriod()
        period.setDates(1, 2, 31, 3)

        expect(period.isWithinAbstractionPeriod(winter)).to.equal(true)
      })

      test('returns true if both start and end dates are the same', async () => {
        const winter = AbstractionPeriod.getWinter()
        const period = AbstractionPeriod.getWinter()

        expect(period.isWithinAbstractionPeriod(winter)).to.equal(true)
      })

      test('returns true if both dates are in between the period', async () => {
        const winter = AbstractionPeriod.getWinter()

        const period = new AbstractionPeriod()
        period.setDates(1, 12, 1, 3)

        expect(period.isWithinAbstractionPeriod(winter)).to.equal(true)
      })

      test('return false if the start date is before the range', async () => {
        const winter = AbstractionPeriod.getWinter()
        const beforewinter = AbstractionPeriod.getWinter()
        beforewinter.startMonth = winter.startMonth - 1

        expect(beforewinter.isWithinAbstractionPeriod(winter)).to.equal(false)
      })

      test('return false if the end date is after the range', async () => {
        const winter = AbstractionPeriod.getWinter()
        const afterSummer = AbstractionPeriod.getWinter()
        afterSummer.endMonth = winter.endMonth + 1

        expect(afterSummer.isWithinAbstractionPeriod(winter)).to.equal(false)
      })

      test('return false if the start and end dates are outside the range', async () => {
        const winter = AbstractionPeriod.getWinter()
        const notWinter = AbstractionPeriod.getWinter()
        notWinter.startMonth = winter.startMonth - 1
        notWinter.endMonth = winter.endMonth + 1

        expect(notWinter.isWithinAbstractionPeriod(winter)).to.equal(false)
      })
    })
  })

  experiment('.getChargeSeason()', () => {
    experiment('when the period matches the summer period', () => {
      test('the season is all year', async () => {
        const period = new AbstractionPeriod()
        period.setDates(1, 4, 31, 10)

        expect(period.getChargeSeason()).to.equal(CHARGE_SEASON.summer)
      })
    })

    experiment('when the period matches the winter period', () => {
      test('the season is all year', async () => {
        const winter = AbstractionPeriod.getWinter()
        expect(winter.getChargeSeason()).to.equal(CHARGE_SEASON.winter)
      })
    })

    experiment('when the period is within the summer period', () => {
      test('the season is summer', async () => {
        const april = new AbstractionPeriod()
        april.setDates(2, 4, 30, 4)
        expect(april.getChargeSeason()).to.equal(CHARGE_SEASON.summer)

        const october = new AbstractionPeriod()
        october.setDates(2, 10, 25, 10)
        expect(october.getChargeSeason()).to.equal(CHARGE_SEASON.summer)
      })
    })

    experiment('when the period is within the winter period', () => {
      test('the season is winter', async () => {
        const november = new AbstractionPeriod()
        november.setDates(2, 11, 30, 11)
        expect(november.getChargeSeason()).to.equal(CHARGE_SEASON.winter)

        const march = new AbstractionPeriod()
        march.setDates(2, 3, 25, 3)
        expect(march.getChargeSeason()).to.equal(CHARGE_SEASON.winter)

        const xmasHols = new AbstractionPeriod()
        xmasHols.setDates(20, 12, 4, 1)

        expect(xmasHols.getChargeSeason()).to.equal(CHARGE_SEASON.winter)
      })
    })
  })

  experiment('.isDateWithinAbstractionPeriod', () => {
    let absPeriod
    beforeEach(async () => {
      absPeriod = new AbstractionPeriod()
      absPeriod.fromHash({
        startDay: 1,
        startMonth: 10,
        endDay: 31,
        endMonth: 3
      })
    })

    test('returns false when the date is before the abstraction period starts', async () => {
      expect(absPeriod.isDateWithinAbstractionPeriod('2020-09-30')).to.be.false()
    })

    test('returns true when the date is within the abstraction period', async () => {
      expect(absPeriod.isDateWithinAbstractionPeriod('2020-10-01')).to.be.true()
      expect(absPeriod.isDateWithinAbstractionPeriod('2021-03-31')).to.be.true()
    })

    test('returns false when the date is after the abstraction period ends', async () => {
      expect(absPeriod.isDateWithinAbstractionPeriod('2020-04-01')).to.be.false()
    })

    test('throws an error if the argument is not a date', async () => {
      const func = () => { absPeriod.isDateWithinAbstractionPeriod('not-a-data') }
      expect(func).to.throw()
    })
  })

  experiment('.getDays', () => {
    let absPeriod, dateRange
    beforeEach(async () => {
      absPeriod = new AbstractionPeriod()
      absPeriod.fromHash({
        startDay: 1,
        startMonth: 10,
        endDay: 31,
        endMonth: 3
      })
      dateRange = new DateRange('2020-01-01', '2020-03-31')
    })

    test('returns the number of abstraction days within the supplied date range', async () => {
      const days = absPeriod.getDays(dateRange)
      expect(days).to.equal(91)
    })

    test('throws an error if a DateRange is not supplied', async () => {
      const func = () => absPeriod.getDays('not-a-date-range')
      expect(func).to.throw()
    })
  })

  experiment('.isDateRangeOverlapping', () => {
    let absPeriod, dateRange
    beforeEach(async () => {
      absPeriod = new AbstractionPeriod()
      absPeriod.fromHash({
        startDay: 1,
        startMonth: 10,
        endDay: 31,
        endMonth: 3
      })
    })

    test('returns true when the date range is in the abstraction period', async () => {
      dateRange = new DateRange('2020-11-01', '2020-11-30')
      expect(absPeriod.isDateRangeOverlapping(dateRange)).to.be.true()
    })

    test('returns true when the date range overlaps the abstraction period', async () => {
      dateRange = new DateRange('2020-09-01', '2020-11-15')
      expect(absPeriod.isDateRangeOverlapping(dateRange)).to.be.true()
    })

    test('returns false when the date range does not overlap the abstraction period', async () => {
      dateRange = new DateRange('2020-09-01', '2020-09-30')
      expect(absPeriod.isDateRangeOverlapping(dateRange)).to.be.false()
    })
  })
})
