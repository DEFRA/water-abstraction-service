'use strict'

// Test framework dependencies
const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
// const sandbox = require('sinon').createSandbox()

const PopulateBatchChargeVersionsService = require('../../src/services/populate-batch-charge-versions.service')

experiment('modules/billing/jobs/populate-batch-charge-versions', () => {
  test('returns true', async () => {
    const result = await PopulateBatchChargeVersionsService.go()

    expect(result).to.be.true()
  })

  experiment('_yearRange', () => {
    test('returns the correct range', () => {
      const result = PopulateBatchChargeVersionsService._yearRange(2015, 2020)

      expect(result).to.include([2015, 2016, 2017, 2018, 2019, 2020])
    })
  })

  experiment('_createBatchChargeVersion', () => {
    test('returns something', async () => {
      const batch = {
        regionId: 'f6c4699f-9a80-419a-82e7-f785ece727e1'
      }
      const year = 2017

      const result = await PopulateBatchChargeVersionsService._createBatchChargeVersion(batch, year)
      console.log('🚀 ~ file: populate-batch-charge-versions.service.test.js ~ line 28 ~ test ~ result', result)
    })
  })

  experiment.only('_getTwoPartTariffSeasons', () => {
    test('returns something', async () => {
      const row = {
        start_date: '2016-04-01',
        end_date: '2017-03-31',
        licence_id: '45c20ae3-f034-466f-87ad-d79b86145131',
        charge_version_id: 'bb50e8bd-5186-4553-b5ca-6c29d76cf2b5'
      }
      const financialYear = 2017
      const regionId = 'f6c4699f-9a80-419a-82e7-f785ece727e1'

      const result = await PopulateBatchChargeVersionsService._getTwoPartTariffSeasons(row, financialYear, regionId)
      console.log('🚀 ~ file: populate-batch-charge-versions.service.test.js ~ line 28 ~ test ~ result', result)
    })
  })
})
