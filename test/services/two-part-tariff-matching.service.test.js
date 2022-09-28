'use strict'

// Test framework dependencies
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
// const sandbox = require('sinon').createSandbox()

// Thing under test
const TwoPartTariffMatchingService = require('../../src/services/two-part-tariff-matching.service')

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

  experiment.only('._datesQuery', () => {
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
})
