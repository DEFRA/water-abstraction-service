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
    test.only('returns whatever', async () => {
      const billingBatchChargeVersionYear = {
        chargeVersionId: 'bb50e8bd-5186-4553-b5ca-6c29d76cf2b5',
        financialYearEnding: 2017,
        isSummer: true
      }
      const result = await TwoPartTariffMatchingService._processBillingBatchChargeVersionYear(billingBatchChargeVersionYear)
      console.log('🚀 ~ file: two-part-tariff-matching.service.test.js ~ line 30 ~ test.only ~ result', result)
    })
  })
})
