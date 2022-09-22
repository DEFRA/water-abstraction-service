'use strict'

// Test framework dependencies
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
// const sandbox = require('sinon').createSandbox()

// Thing under test
const TwoPartTariffMatchingService = require('../../src/services/two-part-tariff-matching.service')

experiment('tpt matching service', () => {
  experiment('.createMessage', () => {
    test.only('returns true', async () => {
      const result = await TwoPartTariffMatchingService.go()
      expect(result).to.be.true()
    })
  })
})
