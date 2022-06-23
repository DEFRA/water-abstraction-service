'use strict'

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const moment = require('moment')
const uuid = require('uuid/v4')

const LicenceVersion = require('../../../src/lib/models/licence-version')

const licenceVersionMapper = require('../../../src/lib/mappers/licence-version')

let dbRow

experiment('modules/billing/mappers/licence-version', () => {
  experiment('.dbToModel', () => {
    let result

    beforeEach(async () => {
      dbRow = {
        status: 'superseded',
        endDate: '2000-01-01',
        startDate: '1990-01-01',
        externalId: '1:11:100:0',
        dateCreated: '2020-06-01 11:10:00.000000',
        dateUpdated: '2020-06-02 11:10:00.000000',
        licenceId: uuid(),
        licenceVersionId: uuid(),
        issue: 100,
        increment: 0,
        licenceVersionPurposes: [{
          licenceVersionPurposeId: uuid(),
          licenceVersionId: uuid(),
          purposePrimaryId: uuid(),
          purposeSecondaryId: uuid(),
          purposeUseId: uuid(),
          abstractionPeriodStartDay: 1,
          abstractionPeriodStartMonth: 4,
          abstractionPeriodEndDay: 30,
          abstractionPeriodEndMonth: 9,
          timeLimitedStartDate: null,
          timeLimitedEndDate: null,
          notes: null,
          annualQuantity: '4546',
          dateCreated: '2020-06-01 11:10:00.000000',
          dateUpdated: '2020-06-02 11:10:00.000000',
          externalId: '6:6747',
          purposeUse: {
            legacyId: '1',
            description: 'Waterslides',
            dateCreated: '2020-06-01 11:10:00.000000',
            dateUpdated: '2020-06-02 11:10:00.000000',
            purposeUseId: uuid(),
            lossFactor: 'high',
            isTwoPartTariff: false
          }
        }]
      }

      result = licenceVersionMapper.dbToModel(dbRow)
    })

    test('returns a LicenceVersion instance with correct ID', async () => {
      expect(result instanceof LicenceVersion).to.be.true()
      expect(result.id).to.equal(dbRow.licenceVersionId)
    })

    test('has a status property', async () => {
      expect(result.status).to.equal(dbRow.status)
    })

    test('has an endDate property', async () => {
      expect(result.endDate).to.equal(moment(dbRow.endDate))
    })

    test('has a startDate property', async () => {
      expect(result.startDate).to.equal(moment(dbRow.startDate))
    })

    test('has an externalId property', async () => {
      expect(result.externalId).to.equal(dbRow.externalId)
    })

    test('has a dateUpdated property', async () => {
      expect(result.dateUpdated).to.equal(moment(dbRow.dateUpdated))
    })

    test('has a dateCreated property', async () => {
      expect(result.dateCreated).to.equal(moment(dbRow.dateCreated))
    })

    test('has an issue property', async () => {
      expect(result.issue).to.equal(dbRow.issue)
    })

    test('has an increment property', async () => {
      expect(result.increment).to.equal(dbRow.increment)
    })

    experiment('licenceVersionPurposes', () => {
      test('has the expected count', async () => {
        expect(result.licenceVersionPurposes.length).to.equal(1)
      })

      test('contains the purpose use', async () => {
        expect(result.licenceVersionPurposes[0].purposeUse.lossFactor).to.equal('high')
      })

      test('is undefined when no data ', async () => {
        delete dbRow.licenceVersionPurposes
        result = licenceVersionMapper.dbToModel(dbRow)

        expect(result.licenceVersionPurposes).to.equal(undefined)
      })
    })
  })
})
