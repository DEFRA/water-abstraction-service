'use strict'

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const uuid = require('uuid/v4')
const moment = require('moment')

const LicenceVersionPurpose = require('../../../src/lib/models/licence-version-purpose')
const AbstractionPeriod = require('../../../src/lib/models/abstraction-period')
const DateRange = require('../../../src/lib/models/date-range')
const PurposeUse = require('../../../src/lib/models/purpose-use')

experiment('lib/models/licence-version-purpose', () => {
  let licenceVersionPurpose

  beforeEach(async () => {
    licenceVersionPurpose = new LicenceVersionPurpose()
  })

  experiment('.id', () => {
    test('can be set to a uuid', async () => {
      const id = uuid()
      licenceVersionPurpose.id = id
      expect(licenceVersionPurpose.id).to.equal(id)
    })

    test('cannot be set to a number', async () => {
      expect(() => { licenceVersionPurpose.id = 123 }).to.throw()
    })
  })

  experiment('.licenceId', () => {
    test('can be set to a uuid', async () => {
      const id = uuid()
      licenceVersionPurpose.licenceId = id
      expect(licenceVersionPurpose.licenceId).to.equal(id)
    })

    test('cannot be set to a number', async () => {
      expect(() => { licenceVersionPurpose.licenceId = 123 }).to.throw()
    })
  })

  experiment('.externalId', () => {
    test('accepts a string', async () => {
      const externalId = '1:2'
      licenceVersionPurpose.externalId = externalId
      expect(licenceVersionPurpose.externalId).to.equal(externalId)
    })

    test('throws for an number', async () => {
      expect(() => { licenceVersionPurpose.externalId = 123 }).to.throw()
    })

    test('throws for a boolean value', async () => {
      expect(() => { licenceVersionPurpose.externalId = true }).to.throw()
    })

    test('throws for null', async () => {
      expect(() => { licenceVersionPurpose.externalId = null }).to.throw()
    })
  })

  experiment('.dateCreated', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z'
      licenceVersionPurpose.dateCreated = dateString

      expect(licenceVersionPurpose.dateCreated).to.equal(moment(dateString))
    })

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date()
      licenceVersionPurpose.dateCreated = date

      expect(licenceVersionPurpose.dateCreated).to.equal(moment(date))
    })

    test('can be set using a moment', async () => {
      const now = moment()
      licenceVersionPurpose.dateCreated = now

      expect(licenceVersionPurpose.dateCreated).to.equal(now)
    })

    test('throws for an invalid string', async () => {
      const dateString = 'not a date'
      expect(() => { licenceVersionPurpose.dateCreated = dateString }).to.throw()
    })

    test('throws for a boolean value', async () => {
      expect(() => { licenceVersionPurpose.dateCreated = true }).to.throw()
    })

    test('throws for null', async () => {
      expect(() => { licenceVersionPurpose.dateCreated = null }).to.throw()
    })
  })

  experiment('.dateUpdated', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z'
      licenceVersionPurpose.dateUpdated = dateString

      expect(licenceVersionPurpose.dateUpdated).to.equal(moment(dateString))
    })

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date()
      licenceVersionPurpose.dateUpdated = date

      expect(licenceVersionPurpose.dateUpdated).to.equal(moment(date))
    })

    test('can be set using a moment', async () => {
      const now = moment()
      licenceVersionPurpose.dateUpdated = now

      expect(licenceVersionPurpose.dateUpdated).to.equal(now)
    })

    test('throws for an invalid string', async () => {
      const dateString = 'not a date'
      expect(() => { licenceVersionPurpose.dateUpdated = dateString }).to.throw()
    })

    test('throws for a boolean value', async () => {
      expect(() => { licenceVersionPurpose.dateUpdated = true }).to.throw()
    })

    test('throws for null', async () => {
      expect(() => { licenceVersionPurpose.dateUpdated = null }).to.throw()
    })
  })

  experiment('abstractionPeriod', () => {
    test('can be set to an instance of AbstractionPeriod', () => {
      const period = new AbstractionPeriod()
      period.startDay = 1
      period.startMonth = 1
      period.endDay = 10
      period.endMonth = 10

      licenceVersionPurpose.abstractionPeriod = period

      expect(licenceVersionPurpose.abstractionPeriod.startDay).to.equal(1)
    })

    test('throws for a string value', async () => {
      expect(() => { licenceVersionPurpose.abstractionPeriod = 'range' }).to.throw()
    })
  })

  experiment('timeLimitedPeriod', () => {
    test('can be set to an instance of DateRange', () => {
      const range = new DateRange('2001-01-01')
      licenceVersionPurpose.timeLimitedPeriod = range

      expect(licenceVersionPurpose.timeLimitedPeriod.startDate).to.equal(range.startDate)
    })

    test('throws for a string value', async () => {
      expect(() => { licenceVersionPurpose.timeLimitedPeriod = 'range' }).to.throw()
    })
  })

  experiment('annualQuantity', () => {
    test('can be set to an integer', () => {
      licenceVersionPurpose.annualQuantity = 123
      expect(licenceVersionPurpose.annualQuantity).to.equal(123)
    })

    test('can be set to an decimal number', () => {
      licenceVersionPurpose.annualQuantity = 0.635
      expect(licenceVersionPurpose.annualQuantity).to.equal(0.635)
    })

    test('can be set to an number that is a string', () => {
      licenceVersionPurpose.annualQuantity = '0.635'
      expect(licenceVersionPurpose.annualQuantity).to.equal('0.635')
    })

    test('can be null', () => {
      licenceVersionPurpose.annualQuantity = null
      expect(licenceVersionPurpose.annualQuantity).to.equal(null)
    })

    test('throws for a string value', async () => {
      expect(() => { licenceVersionPurpose.annualQuantity = 'hello' }).to.throw()
    })
  })

  experiment('notes', () => {
    test('can be set to null', () => {
      licenceVersionPurpose.notes = null
      expect(licenceVersionPurpose.notes).to.equal(null)
    })

    test('can be set to a string value', () => {
      licenceVersionPurpose.notes = 'notes here'
      expect(licenceVersionPurpose.notes).to.equal('notes here')
    })

    test('throws for a number value', async () => {
      expect(() => { licenceVersionPurpose.notes = 123 }).to.throw()
    })
  })

  experiment('purposeUse', () => {
    test('can be set to an instance of PurposeUse', () => {
      const purposeUse = new PurposeUse()
      purposeUse.name = 'hello'
      licenceVersionPurpose.purposeUse = purposeUse

      expect(licenceVersionPurpose.purposeUse.name).to.equal('hello')
    })

    test('throws for a string value', async () => {
      expect(() => { licenceVersionPurpose.purposeUse = 'hello' }).to.throw()
    })
  })
})
