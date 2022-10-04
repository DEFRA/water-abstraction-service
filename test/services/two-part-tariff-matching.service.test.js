'use strict'

// Test framework dependencies
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
// const sandbox = require('sinon').createSandbox()

// Thing under test
const TwoPartTariffMatchingService = require('../../src/services/two-part-tariff-matching.service')

function logSeasonStuff (chargeElement, result) {
  console.log(`S=2018-${chargeElement.abstraction_period_start_month}-${chargeElement.abstraction_period_start_day} | E=2018-${chargeElement.abstraction_period_end_month}-${chargeElement.abstraction_period_end_day} | ${result}`)
}

experiment('tpt matching service', () => {
  experiment('.go', () => {
    test('returns whatever', async () => {
      const batch = {
        id: '4cd8c1d2-1849-4a17-8191-16fe589c998e'
      }
      const result = await TwoPartTariffMatchingService.go(batch)
      console.log('🚀 ~ file: two-part-tariff-matching.service.test.js ~ line 18 ~ test.only ~ result', result)
    })
  })

  experiment('._processBillingBatchChargeVersionYear', () => {
    test('returns whatever', async () => {
      const billingBatchChargeVersionYear = {
        chargeVersionId: 'bb50e8bd-5186-4553-b5ca-6c29d76cf2b5',
        financialYearEnding: 2017,
        isSummer: true
      }
      const result = await TwoPartTariffMatchingService._processBillingBatchChargeVersionYear(billingBatchChargeVersionYear)
      console.log('🚀 ~ file: two-part-tariff-matching.service.test.js ~ line 30 ~ test.only ~ result', result)
    })
  })

  experiment('._datesQuery', () => {
    test('returns whatever', async () => {
      const result = await TwoPartTariffMatchingService._datesQuery('bb50e8bd-5186-4553-b5ca-6c29d76cf2b5', 2017)
      console.log('🚀 ~ file: two-part-tariff-matching.service.test.js ~ line 41 ~ test ~ result', result)
    })
  })

  experiment('._chargeElementsQuery', () => {
    test('returns whatever', async () => {
      const result = await TwoPartTariffMatchingService._chargeElementsQuery('483f78d7-d0ab-49c7-b2ca-e1128fee9f05')
      console.log('🚀 ~ file: two-part-tariff-matching.service.test.js ~ line 30 ~ test.only ~ result', result)
    })
  })

  experiment('._filterOutInvalidChargeElementsByPeriod', () => {
    test('filters correctly', () => {
      const chargeElements = [
        {
          id: 'invalid',
          time_limited_start_date: '1985-05-03',
          time_limited_end_date: '1986-05-03'
        },
        {
          id: 'valid',
          time_limited_start_date: '1985-05-03',
          time_limited_end_date: '2055-05-03'
        },
        {
          id: 'null_dates',
          time_limited_start_date: null,
          time_limited_end_date: null
        }
      ]
      const result = TwoPartTariffMatchingService._filterOutInvalidChargeElementsByPeriod(chargeElements, { start_date: '2016-04-01', end_date: '2017-03-31' })
      console.log('🚀 ~ file: two-part-tariff-matching.service.test.js ~ line 44 ~ test ~ result', result)
    })
  })

  // experiment('._calculateAbstractionRange()', () => {
  //   let period

  //   experiment('summer periods', () => {
  //     beforeEach(() => {
  //       period = {
  //         startDay: 1,
  //         startMonth: 4,
  //         endDay: 31,
  //         endMonth: 10
  //       }
  //     })

  //     test('summer 2017', () => {
  //       const year = 2017

  //       const result = TwoPartTariffMatchingService._calculateAbstractionRange(period, year)

  //       console.log(`S=${year}-${period.startMonth}-${period.startDay} | E=${year}-${period.endMonth}-${period.endDay} | ${result}`)
  //     })

  //     test('summer 2018', () => {
  //       const year = 2018

  //       const result = TwoPartTariffMatchingService._calculateAbstractionRange(period, year)

  //       console.log(`S=${year}-${period.startMonth}-${period.startDay} | E=${year}-${period.endMonth}-${period.endDay} | ${result}`)
  //     })
  //   })

  //   experiment('winter periods', () => {
  //     beforeEach(() => {
  //       period = {
  //         startDay: 1,
  //         startMonth: 11,
  //         endDay: 31,
  //         endMonth: 3
  //       }
  //     })
  //     test('winter 2017', () => {
  //       const year = 2017

  //       const result = TwoPartTariffMatchingService._calculateAbstractionRange(period, year)

  //       console.log(`S=${year}-${period.startMonth}-${period.startDay} | E=${year}-${period.endMonth}-${period.endDay} | ${result}`)
  //     })

  //     test('winter 2018', () => {
  //       const year = 2018

  //       const result = TwoPartTariffMatchingService._calculateAbstractionRange(period, year)

  //       console.log(`S=${year}-${period.startMonth}-${period.startDay} | E=${year}-${period.endMonth}-${period.endDay} | ${result}`)
  //     })
  //   })

  //   experiment('abstraction periods', () => {
  //     test('start before end', () => {
  //       period = {
  //         startDay: 1,
  //         startMonth: 3,
  //         endDay: 31,
  //         endMonth: 10
  //       }

  //       const result = TwoPartTariffMatchingService._calculateAbstractionRange(period, 2018)

  //       console.log(`S=2018-${period.startMonth}-${period.startDay} | E=2018-${period.endMonth}-${period.endDay} | ${result}`)
  //     })

  //     test('end before start', () => {
  //       period = {
  //         startDay: 31,
  //         startMonth: 10,
  //         endDay: 1,
  //         endMonth: 5
  //       }

  //       const result = TwoPartTariffMatchingService._calculateAbstractionRange(period, 2018)

  //       console.log(`S=2018-${period.startMonth}-${period.startDay} | E=2018-${period.endMonth}-${period.endDay} | ${result}`)
  //     })

  //     test('end before start days', () => {
  //       period = {
  //         startDay: 20,
  //         startMonth: 5,
  //         endDay: 10,
  //         endMonth: 5
  //       }

  //       const result = TwoPartTariffMatchingService._calculateAbstractionRange(period, 2018)

  //       console.log(`S=2018-${period.startMonth}-${period.startDay} | E=2018-${period.endMonth}-${period.endDay} | ${result}`)
  //     })
  //   })
  // })

  experiment('._calculateChargeElementSeason()', () => {
    experiment('when the season being checked is summer', () => {
      test('start before end and out of summer dates', () => {
        const chargeElement = {
          abstraction_period_start_day: 1,
          abstraction_period_start_month: 3,
          abstraction_period_end_day: 31,
          abstraction_period_end_month: 10
        }

        const result = TwoPartTariffMatchingService._calculateChargeElementSeason(chargeElement)

        logSeasonStuff(chargeElement, result)

        expect(result).to.equal('all year')
      })

      test('start before end and in summer dates', () => {
        const chargeElement = {
          abstraction_period_start_day: 1,
          abstraction_period_start_month: 4,
          abstraction_period_end_day: 31,
          abstraction_period_end_month: 10
        }

        const result = TwoPartTariffMatchingService._calculateChargeElementSeason(chargeElement)

        logSeasonStuff(chargeElement, result)

        expect(result).to.equal('summer')
      })

      test('start after end and looks like in summer dates', () => {
        const chargeElement = {
          abstraction_period_start_day: 20,
          abstraction_period_start_month: 5,
          abstraction_period_end_day: 1,
          abstraction_period_end_month: 5
        }

        const result = TwoPartTariffMatchingService._calculateChargeElementSeason(chargeElement)

        logSeasonStuff(chargeElement, result)

        expect(result).to.equal('all year')
      })
    })
  })

  experiment.only('_returnLineStraddlesChargePeriod()', () => {
    test('it does not straddle the charge period', () => {
      const returnLine = {
        start_date: new Date('2016-05-01'),
        end_date: new Date('2017-02-03')
      }

      const result = TwoPartTariffMatchingService._returnLineStraddlesChargePeriod(returnLine, 2017)
      expect(result).to.equal(false)
    })

    test('it does straddle the charge period', () => {
      const returnLine = {
        start_date: new Date('2016-03-01'),
        end_date: new Date('2017-02-03')
      }

      const result = TwoPartTariffMatchingService._returnLineStraddlesChargePeriod(returnLine, 2017)
      expect(result).to.equal(true)
    })
  })
})
