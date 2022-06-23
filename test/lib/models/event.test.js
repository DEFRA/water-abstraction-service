const moment = require('moment')
// const uuid = require('uuid/v4');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const { Event } = require('../../../src/lib/models')

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a921234'

class TestClass {

}
const TEST_MODEL = new TestClass()

experiment('lib/models/event', () => {
  let event

  beforeEach(async () => {
    event = new Event()
  })

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      event.id = TEST_GUID
      expect(event.id).to.equal(TEST_GUID)
    })

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        event.id = 'false-guid'
      }
      expect(func).to.throw()
    })
  })

  experiment('construction', () => {
    test('can include an id in the constructor', async () => {
      const inv = new Event(TEST_GUID)
      expect(inv.id).to.equal(TEST_GUID)
    })

    test('can omit the id in the constructor', async () => {
      const inv = new Event()
      expect(inv.id).to.be.undefined()
    })
  })

  experiment('.subtype', () => {
    test('can be set to a string', async () => {
      event.subtype = 'test-subtype'
      expect(event.subtype).to.equal('test-subtype')
    })

    test('can be set to null', async () => {
      event.subtype = null
      expect(event.subtype).to.equal(null)
    })

    test('throws an error if not null/string', async () => {
      const func = () => { event.subtype = 1.2344 }
      expect(func).to.throw()
    })
  })

  experiment('get and set for event fields', () => {
    const event = new Event()
    event.referenceCode = 'test-reference-code'
    event.type = 'test-type'
    event.issuer = 'test-issuer'
    event.comment = 'test-comment'
    event.metadata = { test: 'data' }
    event.status = 'test-status'

    test('referenceCode', () => {
      expect(event.referenceCode).to.equal('test-reference-code')
    })
    test('type', () => {
      expect(event.type).to.equal('test-type')
    })
    test('issuer', () => {
      expect(event.issuer).to.equal('test-issuer')
    })
    test('comment', () => {
      expect(event.comment).to.equal('test-comment')
    })
    test('metadata', () => {
      expect(event.metadata).to.equal({ test: 'data' })
    })
    test('status', () => {
      expect(event.status).to.equal('test-status')
    })
  })

  experiment('licences', () => {
    test('returns the correct licence number from an array', async () => {
      const event = new Event()
      event.licences = ['LIC1', 'LIC2', 'LIC3']
      expect(event.licences[1]).to.equal('LIC2')
    })

    test('returns an empty array if there is no licence data', async () => {
      const event = new Event()
      expect(event.licences).to.equal([])
    })

    test('throws an error if licence is not string', async () => {
      const event = new Event()
      const func = () => {
        event.licences = [TEST_MODEL]
      }
      expect(func).to.throw()
    })
  })

  experiment('entities', () => {
    test('set and return an instance of object', async () => {
      const event = new Event()
      event.entities = { data: 'test object' }
      expect(event.entities).to.equal({ data: 'test object' })
    })

    test('throws an error if not set to an instance of object', async () => {
      const event = new Event()
      const func = () => {
        event.entities = ''
      }
      expect(func).to.throw()
    })
  })

  experiment('.created and modified', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z'
      const event = new Event()
      event.created = dateString
      event.modified = dateString

      expect(moment.isMoment(event.created)).to.equal(true)
      expect(moment.isMoment(event.modified)).to.equal(true)
    })

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date()
      const event = new Event()
      event.created = date
      event.modified = date

      expect(event.created).to.equal(moment(date))
      expect(event.modified).to.equal(moment(date))
    })

    test('can be set using a moment', async () => {
      const now = moment()

      const event = new Event()
      event.created = now
      event.modified = now

      expect(event.created).to.equal(now)
      expect(event.modified).to.equal(now)
    })

    test('throws for an invalid string', async () => {
      const dateString = 'not a date'
      const event = new Event()

      expect(() => {
        event.created = dateString
      }).to.throw()

      expect(() => {
        event.modified = dateString
      }).to.throw()
    })

    test('throws for a boolean value', async () => {
      const event = new Event()

      expect(() => {
        event.created = true
      }).to.throw()

      expect(() => {
        event.modified = true
      }).to.throw()
    })

    test('allows null', async () => {
      const event = new Event()
      event.created = null
      event.modifed = null
      expect(event.created).to.be.null()
      expect(event.modifed).to.be.null()
    })
  })
})
