'use strict'

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const moment = require('moment')

const Purpose = require('../../../src/lib/models/purpose')

experiment('lib/models/purpose', () => {
  let purpose

  experiment('constructor', () => {
    test('can be called with no arguments', async () => {
      purpose = new Purpose()
      expect(purpose.id).to.be.undefined()
    })
  })

  experiment('properties', () => {
    beforeEach(async () => {
      purpose = new Purpose()
    })

    experiment('.type', () => {
      test('can be set to "primary"', async () => {
        purpose.type = Purpose.PURPOSE_TYPES.primary
        expect(purpose.type).to.equal(Purpose.PURPOSE_TYPES.primary)
      })

      test('can be set to "secondary"', async () => {
        purpose.type = Purpose.PURPOSE_TYPES.secondary
        expect(purpose.type).to.equal(Purpose.PURPOSE_TYPES.secondary)
      })

      test('setting type to invalid value throws an error', async () => {
        const func = () => {
          purpose.type = 'not-a-valid-type'
        }
        expect(func).throw()
      })
    })

    experiment('.name', () => {
      test('can set name to a string', async () => {
        purpose.name = 'Watering onions'
        expect(purpose.name).to.equal('Watering onions')
      })

      test('setting name to invalid value throws an error', async () => {
        const func = () => {
          purpose.name = 123
        }
        expect(func).throw()
      })
    })

    experiment('.code', () => {
      test('can set code to an alphanumeric string', async () => {
        purpose.code = 'ABCD123'
        expect(purpose.code).to.equal('ABCD123')
      })

      test('setting code to invalid value throws an error', async () => {
        const func = () => {
          purpose.code = 123
        }
        expect(func).throw()
      })
    })

    experiment('.dateCreated', () => {
      test('converts an ISO date string to a moment internally', async () => {
        const dateString = '2020-01-20T14:51:42.024Z'
        const purpose = new Purpose()
        purpose.dateCreated = dateString

        expect(purpose.dateCreated).to.equal(moment(dateString))
      })

      test('converts a JS Date to a moment internally', async () => {
        const date = new Date()
        const purpose = new Purpose()
        purpose.dateCreated = date

        expect(purpose.dateCreated).to.equal(moment(date))
      })

      test('can be set using a moment', async () => {
        const now = moment()

        const purpose = new Purpose()
        purpose.dateCreated = now

        expect(purpose.dateCreated).to.equal(now)
      })

      test('throws for an invalid string', async () => {
        const dateString = 'not a date'
        const purpose = new Purpose()

        expect(() => {
          purpose.dateCreated = dateString
        }).to.throw()
      })

      test('throws for a boolean value', async () => {
        const purpose = new Purpose()

        expect(() => {
          purpose.dateCreated = true
        }).to.throw()
      })

      test('throws for a null value', async () => {
        const purpose = new Purpose()

        expect(() => {
          purpose.dateCreated = null
        }).to.throw()
      })
    })

    experiment('.dateUpdated', () => {
      test('converts an ISO date string to a moment internally', async () => {
        const dateString = '2020-01-20T14:51:42.024Z'
        const purpose = new Purpose()
        purpose.dateUpdated = dateString

        expect(purpose.dateUpdated).to.equal(moment(dateString))
      })

      test('converts a JS Date to a moment internally', async () => {
        const date = new Date()
        const purpose = new Purpose()
        purpose.dateUpdated = date

        expect(purpose.dateUpdated).to.equal(moment(date))
      })

      test('can be set using a moment', async () => {
        const now = moment()

        const purpose = new Purpose()
        purpose.dateUpdated = now

        expect(purpose.dateUpdated).to.equal(now)
      })

      test('throws for an invalid string', async () => {
        const dateString = 'not a date'
        const purpose = new Purpose()

        expect(() => {
          purpose.dateUpdated = dateString
        }).to.throw()
      })

      test('throws for a boolean value', async () => {
        const purpose = new Purpose()

        expect(() => {
          purpose.dateUpdated = true
        }).to.throw()
      })

      test('allows null', async () => {
        const purpose = new Purpose()
        purpose.dateUpdated = null
        expect(purpose.dateUpdated).to.be.null()
      })
    })
  })
})
