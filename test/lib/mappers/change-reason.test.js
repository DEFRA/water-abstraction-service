const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const ChangeReason = require('../../../src/lib/models/change-reason')
const changeReasonMapper = require('../../../src/lib/mappers/change-reason')

const dbRow = {
  changeReasonId: '00000000-0000-0000-0000-000000000000',
  description: 'test description',
  triggersMinimumCharge: true,
  type: 'new_chargeable_charge_version',
  isEnabledForNewChargeVersions: true
}

const pojo = {
  id: '00000000-0000-0000-0000-000000000000',
  description: 'test description',
  triggersMinimumCharge: true,
  type: 'new_chargeable_charge_version',
  isEnabledForNewChargeVersions: true
}

experiment('modules/billing/mappers/change-reason', () => {
  experiment('.dbToModel', () => {
    let result

    beforeEach(async () => {
      result = changeReasonMapper.dbToModel(dbRow)
    })

    test('returns null when data is null', async () => {
      const result = changeReasonMapper.dbToModel(null)
      expect(result).to.equal(null)
    })

    test('returns null when data is empty', async () => {
      const result = changeReasonMapper.dbToModel({})
      expect(result).to.equal(null)
    })

    test('returns an ChangeReason instance', async () => {
      expect(result instanceof ChangeReason).to.be.true()
    })

    test('has the expected id value', async () => {
      expect(result.id).to.equal(dbRow.changeReasonId)
    })

    test('has the expected name value', async () => {
      expect(result.description).to.equal(dbRow.description)
    })

    test('has the expected triggersMinimumCharge value', async () => {
      expect(result.triggersMinimumCharge).to.equal(dbRow.triggersMinimumCharge)
    })

    test('has the expected isEnabledForNewChargeVersions value', async () => {
      expect(result.isEnabledForNewChargeVersions).to.be.true()
    })
  })

  experiment('.pojoToModel', () => {
    let result

    beforeEach(async () => {
      result = changeReasonMapper.pojoToModel(pojo)
    })

    test('returns an ChangeReason instance', async () => {
      expect(result instanceof ChangeReason).to.be.true()
    })

    test('has the expected id value', async () => {
      expect(result.id).to.equal(pojo.id)
    })

    test('has the expected name value', async () => {
      expect(result.description).to.equal(pojo.description)
    })

    test('has the expected triggersMinimumCharge value', async () => {
      expect(result.triggersMinimumCharge).to.equal(pojo.triggersMinimumCharge)
    })

    test('has the expected type', async () => {
      expect(result.type).to.equal(pojo.type)
    })

    test('has the expected isEnabledForNewChargeVersions', async () => {
      expect(result.isEnabledForNewChargeVersions).to.be.true()
    })
  })
})
