'use strict'

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const { v4: uuid } = require('uuid')

const ReturnRequirement = require('../../../src/lib/models/return-requirement')
const ReturnRequirementPurpose = require('../../../src/lib/models/return-requirement-purpose')
const PurposeUse = require('../../../src/lib/models/purpose-use')

const returnRequirementMapper = require('../../../src/lib/mappers/return-requirement')

const createDBRow = () => ({
  returnRequirementId: uuid(),
  isSummer: true,
  externalId: '1:123',
  legacyId: 123,
  returnRequirementPurposes: [
    {
      returnRequirementPurposeId: uuid(),
      purposeUse: {
        purposeUseId: uuid(),
        legacyId: '999',
        description: 'Beetroot spritzing',
        lossFactor: 'low',
        dateCreated: '2019-03-01',
        dateUpdated: '2019-03-01',
        isTwoPartTariff: false

      }
    }
  ]
})

experiment('modules/billing/mappers/return-requirement', () => {
  experiment('.dbToModel', () => {
    let dbRow, result

    experiment('when there are no returnRequirementPurposes', () => {
      beforeEach(async () => {
        dbRow = createDBRow()
        delete dbRow.returnRequirementPurposes
        result = returnRequirementMapper.dbToModel(dbRow)
      })

      test('returns a ReturnRequirement model', async () => {
        expect(result).to.be.an.instanceof(ReturnRequirement)
      })

      test('has the .id property', async () => {
        expect(result.id).to.equal(dbRow.returnRequirementId)
      })

      test('has the .isSummer property', async () => {
        expect(result.isSummer).to.equal(dbRow.isSummer)
      })

      test('has the .externalId property', async () => {
        expect(result.externalId).to.equal(dbRow.externalId)
      })

      test('has an empty array of returnRequirementPurposes', async () => {
        expect(result.returnRequirementPurposes).to.equal([])
      })

      test('has the .legacyId property', async () => {
        expect(result.legacyId).to.equal(dbRow.legacyId)
      })
    })

    experiment('when there are returnRequirementPurposes', () => {
      beforeEach(async () => {
        dbRow = createDBRow()
        result = returnRequirementMapper.dbToModel(dbRow)
      })

      test('has an array of returnRequirementPurposes', async () => {
        expect(result.returnRequirementPurposes).to.be.an.array().length(1)
      })

      test('has the correct returnRequirementPurpose', async () => {
        const [returnRequirementPurpose] = result.returnRequirementPurposes
        expect(returnRequirementPurpose).to.be.an.instanceof(ReturnRequirementPurpose)
        expect(returnRequirementPurpose.id).to.equal(dbRow.returnRequirementPurposes[0].returnRequirementPurposeId)
      })

      test('has the correct purposeUse', async () => {
        const { purposeUse } = result.returnRequirementPurposes[0]
        expect(purposeUse).to.be.an.instanceof(PurposeUse)
        expect(purposeUse.id).to.equal(dbRow.returnRequirementPurposes[0].purposeUse.purposeUseId)
      })
    })
  })
})
