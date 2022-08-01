'use strict'

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const uuid = require('uuid/v4')
const moment = require('moment')

const LicenceVersion = require('../../../src/lib/models/licence-version')
const LicenceVersionPurpose = require('../../../src/lib/models/licence-version-purpose')

experiment('lib/models/licence-agreement', () => {
  let licenceVersion

  beforeEach(async () => {
    licenceVersion = new LicenceVersion()
  })

  experiment('.id', () => {
    test('can be set to a uuid', async () => {
      const id = uuid()
      licenceVersion.id = id
      expect(licenceVersion.id).to.equal(id)
    })

    test('cannot be set to a number', async () => {
      expect(() => { licenceVersion.id = 123 }).to.throw()
    })
  })

  experiment('.issue', () => {
    test('can be set to an integer', async () => {
      const issue = 123
      licenceVersion.issue = issue
      expect(licenceVersion.issue).to.equal(issue)
    })

    test('cannot be set to a floating point number', async () => {
      expect(() => { licenceVersion.issue = 1.23 }).to.throw()
    })
  })

  experiment('.increment', () => {
    test('can be set to an integer', async () => {
      const increment = 1
      licenceVersion.increment = increment
      expect(licenceVersion.increment).to.equal(increment)
    })

    test('cannot be set to a floating point number', async () => {
      expect(() => { licenceVersion.increment = 1.23 }).to.throw()
    })
  })

  experiment('.status', () => {
    test('can be set to draft', async () => {
      const status = 'draft'
      licenceVersion.status = status
      expect(licenceVersion.status).to.equal(status)
    })

    test('can be set to superseded', async () => {
      const status = 'superseded'
      licenceVersion.status = status
      expect(licenceVersion.status).to.equal(status)
    })

    test('can be set to current', async () => {
      const status = 'current'
      licenceVersion.status = status
      expect(licenceVersion.status).to.equal(status)
    })

    test('cannot be set to a different value', async () => {
      expect(() => { licenceVersion.status = 'finished' }).to.throw()
    })
  })

  experiment('.startDate', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z'
      licenceVersion.startDate = dateString

      expect(licenceVersion.startDate).to.equal(moment(dateString))
    })

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date()
      licenceVersion.startDate = date

      expect(licenceVersion.startDate).to.equal(moment(date))
    })

    test('can be set using a moment', async () => {
      const now = moment()
      licenceVersion.startDate = now

      expect(licenceVersion.startDate).to.equal(now)
    })

    test('throws for an invalid string', async () => {
      const dateString = 'not a date'
      expect(() => { licenceVersion.startDate = dateString }).to.throw()
    })

    test('throws for a boolean value', async () => {
      expect(() => { licenceVersion.startDate = true }).to.throw()
    })

    test('throws for null', async () => {
      expect(() => { licenceVersion.startDate = null }).to.throw()
    })
  })

  experiment('.endDate', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z'
      licenceVersion.endDate = dateString

      expect(licenceVersion.endDate).to.equal(moment(dateString))
    })

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date()
      licenceVersion.endDate = date

      expect(licenceVersion.endDate).to.equal(moment(date))
    })

    test('can be set using a moment', async () => {
      const now = moment()
      licenceVersion.endDate = now

      expect(licenceVersion.endDate).to.equal(now)
    })

    test('throws for an invalid string', async () => {
      const dateString = 'not a date'
      expect(() => { licenceVersion.endDate = dateString }).to.throw()
    })

    test('throws for a boolean value', async () => {
      expect(() => { licenceVersion.endDate = true }).to.throw()
    })

    test('allows null', async () => {
      licenceVersion.endDate = null
      expect(licenceVersion.endDate).to.be.null()
    })
  })

  experiment('.dateCreated', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z'
      licenceVersion.dateCreated = dateString

      expect(licenceVersion.dateCreated).to.equal(moment(dateString))
    })

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date()
      licenceVersion.dateCreated = date

      expect(licenceVersion.dateCreated).to.equal(moment(date))
    })

    test('can be set using a moment', async () => {
      const now = moment()
      licenceVersion.dateCreated = now

      expect(licenceVersion.dateCreated).to.equal(now)
    })

    test('throws for an invalid string', async () => {
      const dateString = 'not a date'
      expect(() => { licenceVersion.dateCreated = dateString }).to.throw()
    })

    test('throws for a boolean value', async () => {
      expect(() => { licenceVersion.dateCreated = true }).to.throw()
    })

    test('throws for null', async () => {
      expect(() => { licenceVersion.dateCreated = null }).to.throw()
    })
  })

  experiment('.dateUpdated', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z'
      licenceVersion.dateUpdated = dateString

      expect(licenceVersion.dateUpdated).to.equal(moment(dateString))
    })

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date()
      licenceVersion.dateUpdated = date

      expect(licenceVersion.dateUpdated).to.equal(moment(date))
    })

    test('can be set using a moment', async () => {
      const now = moment()
      licenceVersion.dateUpdated = now

      expect(licenceVersion.dateUpdated).to.equal(now)
    })

    test('throws for an invalid string', async () => {
      const dateString = 'not a date'
      expect(() => { licenceVersion.dateUpdated = dateString }).to.throw()
    })

    test('throws for a boolean value', async () => {
      expect(() => { licenceVersion.dateUpdated = true }).to.throw()
    })

    test('throws for null', async () => {
      expect(() => { licenceVersion.dateUpdated = null }).to.throw()
    })
  })

  experiment('.externalId', () => {
    test('accepts a string', async () => {
      const externalId = '1:2'
      licenceVersion.externalId = externalId
      expect(licenceVersion.externalId).to.equal(externalId)
    })

    test('throws for an number', async () => {
      expect(() => { licenceVersion.externalId = 123 }).to.throw()
    })

    test('throws for a boolean value', async () => {
      expect(() => { licenceVersion.externalId = true }).to.throw()
    })

    test('throws for null', async () => {
      expect(() => { licenceVersion.externalId = null }).to.throw()
    })
  })

  experiment('.licenceVersionPurposes', () => {
    test('throws when the items in the array are not LicenceVersionPurpose objects', async () => {
      const arr = [1, 2, 3]
      expect(() => { licenceVersion.licenceVersionPurposes = arr }).to.throw()
    })

    test('can be set to an array of LicenceVersionPurpose objects', async () => {
      const purposes = [new LicenceVersionPurpose(uuid())]
      licenceVersion.licenceVersionPurposes = purposes

      expect(licenceVersion.licenceVersionPurposes.length).to.equal(1)
      expect(licenceVersion.licenceVersionPurposes[0].id).to.equal(purposes[0].id)
    })
  })
})
