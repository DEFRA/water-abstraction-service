'use strict'

// Test framework dependencies
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
// const sandbox = require('sinon').createSandbox()

// Thing under test
const TwoPartTariffMatchingService = require('../../src/services/two-part-tariff-matching.service')

experiment('tpt matching service', () => {
  experiment('.go', () => {
    test.only('returns whatever', async () => {
      const batch = {
        id: '4cd8c1d2-1849-4a17-8191-16fe589c998e'
      }
      const result = await TwoPartTariffMatchingService.go(batch)
      console.log('🚀 ~ file: two-part-tariff-matching.service.test.js ~ line 18 ~ test.only ~ result', result)
    })
  })
})
