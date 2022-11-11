'use strict'

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const { v4: uuid } = require('uuid')
const mapper = require('../../../src/lib/mappers/region')

experiment('modules/billing/mappers/region', () => {
  experiment('.dbToModel', () => {
    let mapped
    let row

    beforeEach(async () => {
      row = {
        regionId: uuid(),
        name: 'Test Region',
        chargeRegionId: 'A',
        naldRegionId: 9,
        displayName: 'Display Region'
      }

      mapped = mapper.dbToModel(row)
    })

    test('has a region type', async () => {
      expect(mapped.type).to.equal('region')
    })

    test('has the mapped id', async () => {
      expect(mapped.id).to.equal(row.regionId)
    })

    test('has the mapped name', async () => {
      expect(mapped.name).to.equal(row.name)
    })

    test('has the mapped code', async () => {
      expect(mapped.code).to.equal(row.chargeRegionId)
    })

    test('has the mapped numeric code', async () => {
      expect(mapped.numericCode).to.equal(row.naldRegionId)
    })

    test('has the mapped display name', async () => {
      expect(mapped.displayName).to.equal(row.displayName)
    })
  })
})
