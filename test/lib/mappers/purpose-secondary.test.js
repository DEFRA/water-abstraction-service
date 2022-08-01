'use strict'

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const moment = require('moment')

const Purpose = require('../../../src/lib/models/purpose')

const purposeSecondaryMapper = require('../../../src/lib/mappers/purpose-secondary')

const dbRow = {
  legacyId: '123',
  dateCreated: '2020-05-06 15:00:04.942199',
  dateUpdated: '2020-06-17 10:50:09.260824',
  description: 'Water slides',
  purposeSecondaryId: 'e2bee7e5-923b-4f67-b163-38bc51f623c1'
}

experiment('lib/mappers/purpose-secondary', () => {
  experiment('.dbToModel', () => {
    let result

    beforeEach(async () => {
      result = purposeSecondaryMapper.dbToModel(dbRow)
    })

    test('returns a Purpose instance with correct ID', async () => {
      expect(result instanceof Purpose).to.be.true()
      expect(result.id).to.equal(dbRow.purposeSecondaryId)
    })

    test('has a name property', async () => {
      expect(result.name).to.equal(dbRow.description)
    })

    test('has a code', async () => {
      expect(result.code).to.equal(dbRow.legacyId)
    })

    test('has a dateUpdated property', async () => {
      expect(result.dateUpdated).to.equal(moment(dbRow.dateUpdated))
    })

    test('has a dateCreated property', async () => {
      expect(result.dateCreated).to.equal(moment(dbRow.dateCreated))
    })
  })

  experiment('.pojoToModel', () => {
    let result

    const obj = {
      code: '123',
      dateCreated: '2020-05-06 15:00:04.942199',
      dateUpdated: '2020-06-17 10:50:09.260824',
      description: 'Water slides',
      id: 'e2bee7e5-923b-4f67-b163-38bc51f623c1'
    }

    beforeEach(async () => {
      result = purposeSecondaryMapper.pojoToModel(obj)
    })

    test('returns a Purpose instance', async () => {
      expect(result).to.be.an.instanceof(Purpose)
    })

    test('has the properties mapped correctly', async () => {
      expect(result.code).to.equal(obj.code)
      expect(result.id).to.equal(obj.id)
      expect(result.description).to.equal(obj.description)
      expect(result.dateCreated).to.equal(moment(obj.dateCreated))
      expect(result.dateUpdated).to.equal(moment(obj.dateUpdated))
    })
  })
})
