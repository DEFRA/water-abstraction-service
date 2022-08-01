'use strict'

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const moment = require('moment')

const ChargeVersion = require('../../../src/lib/models/charge-version')
const ChargeVersionWorkflow = require('../../../src/lib/models/charge-version-workflow')

const Licence = require('../../../src/lib/models/licence')
const User = require('../../../src/lib/models/user')

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580'

class TestModel {};

experiment('lib/models/charge-version-workflow', () => {
  let chargeVersionWorkflow

  beforeEach(async () => {
    chargeVersionWorkflow = new ChargeVersionWorkflow()
  })

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      chargeVersionWorkflow.id = TEST_GUID
      expect(chargeVersionWorkflow.id).to.equal(TEST_GUID)
    })

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        chargeVersionWorkflow.id = 'hey'
      }
      expect(func).to.throw()
    })
  })

  experiment('.licence', () => {
    test('can be set to a Licence instance', async () => {
      const licence = new Licence()
      chargeVersionWorkflow.licence = licence
      expect(chargeVersionWorkflow.licence).to.equal(licence)
    })

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        chargeVersionWorkflow.licence = new TestModel()
      }
      expect(func).to.throw()
    })
  })

  experiment('.createdBy', () => {
    const user = new User()

    test('can be set to a User instance', async () => {
      chargeVersionWorkflow.createdBy = user
      expect(chargeVersionWorkflow.createdBy).to.equal(user)
    })

    test('can be set to null', async () => {
      chargeVersionWorkflow.createdBy = null
      expect(chargeVersionWorkflow.createdBy).to.be.null()
    })

    test('throws an error if set to any other type', async () => {
      const func = () => {
        chargeVersionWorkflow.createdBy = new TestModel()
      }
      expect(func).to.throw()
    })
  })

  experiment('.approverComments', () => {
    test('can be set to null', async () => {
      chargeVersionWorkflow.approverComments = null
      expect(chargeVersionWorkflow.approverComments).to.equal(null)
    })

    test('can be set to a string value', async () => {
      chargeVersionWorkflow.approverComments = 'test'
      expect(chargeVersionWorkflow.approverComments).to.equal('test')
    })

    test('throws an error if set to a number', async () => {
      const func = () => { chargeVersionWorkflow.approverComments = 123 }
      expect(func).to.throw()
    })
  })

  experiment('.status', () => {
    ['review', 'changes_requested', 'to_setup'].forEach(status => {
      test(`can be set to "${status}"`, async () => {
        chargeVersionWorkflow.status = status
        expect(chargeVersionWorkflow.status).to.equal(status)
      })
    })

    test('throws an error if set to a different status', async () => {
      const func = () => {
        chargeVersionWorkflow.status = 'not-a-valid-status'
      }
      expect(func).to.throw()
    })
  })

  experiment('.chargeVersion', () => {
    test('can be set to a ChargeVersion instance', async () => {
      const chargeVersion = new ChargeVersion()
      chargeVersionWorkflow.chargeVersion = chargeVersion
      expect(chargeVersionWorkflow.chargeVersion).to.equal(chargeVersion)
    })

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        chargeVersionWorkflow.chargeVersion = new TestModel()
      }
      expect(func).to.throw()
    })
  })

  experiment('.dateCreated', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z'
      chargeVersionWorkflow.dateCreated = dateString
      expect(chargeVersionWorkflow.dateCreated).to.equal(moment(dateString))
    })

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date()
      chargeVersionWorkflow.dateCreated = date

      expect(chargeVersionWorkflow.dateCreated).to.equal(moment(date))
    })

    test('can be set using a moment', async () => {
      const now = moment()

      chargeVersionWorkflow.dateCreated = now

      expect(chargeVersionWorkflow.dateCreated).to.equal(now)
    })

    test('throws for an invalid string', async () => {
      const dateString = 'not a date'

      expect(() => {
        chargeVersionWorkflow.dateCreated = dateString
      }).to.throw()
    })

    test('throws for a boolean value', async () => {
      expect(() => {
        chargeVersionWorkflow.dateCreated = true
      }).to.throw()
    })

    test('allows null', async () => {
      chargeVersionWorkflow.dateCreated = null
      expect(chargeVersionWorkflow.dateCreated).to.be.null()
    })
  })

  experiment('.dateUpdated', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z'
      chargeVersionWorkflow.dateUpdated = dateString

      expect(chargeVersionWorkflow.dateUpdated).to.equal(moment(dateString))
    })

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date()
      chargeVersionWorkflow.dateUpdated = date

      expect(chargeVersionWorkflow.dateUpdated).to.equal(moment(date))
    })

    test('can be set using a moment', async () => {
      const now = moment()

      chargeVersionWorkflow.dateUpdated = now

      expect(chargeVersionWorkflow.dateUpdated).to.equal(now)
    })

    test('throws for an invalid string', async () => {
      const dateString = 'not a date'

      expect(() => {
        chargeVersionWorkflow.dateUpdated = dateString
      }).to.throw()
    })

    test('throws for a boolean value', async () => {
      expect(() => {
        chargeVersionWorkflow.dateUpdated = true
      }).to.throw()
    })

    test('allows null', async () => {
      chargeVersionWorkflow.dateUpdated = null
      expect(chargeVersionWorkflow.dateUpdated).to.be.null()
    })
  })

  experiment('.dateDeleted', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z'
      chargeVersionWorkflow.dateDeleted = dateString

      expect(chargeVersionWorkflow.dateDeleted).to.equal(moment(dateString))
    })

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date()
      chargeVersionWorkflow.dateDeleted = date

      expect(chargeVersionWorkflow.dateDeleted).to.equal(moment(date))
    })

    test('can be set using a moment', async () => {
      const now = moment()

      chargeVersionWorkflow.dateDeleted = now

      expect(chargeVersionWorkflow.dateDeleted).to.equal(now)
    })

    test('throws for an invalid string', async () => {
      const dateString = 'not a date'

      expect(() => {
        chargeVersionWorkflow.dateDeleted = dateString
      }).to.throw()
    })

    test('throws for a boolean value', async () => {
      expect(() => {
        chargeVersionWorkflow.dateDeleted = true
      }).to.throw()
    })

    test('allows null', async () => {
      chargeVersionWorkflow.dateDeleted = null
      expect(chargeVersionWorkflow.dateDeleted).to.be.null()
    })
  })

  experiment('.licenceVersionId', () => {
    test('can be set to a guid string', async () => {
      chargeVersionWorkflow.licenceVersionId = TEST_GUID
      expect(chargeVersionWorkflow.licenceVersionId).to.equal(TEST_GUID)
    })

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        chargeVersionWorkflow.licenceVersionId = 'WHAT?'
      }
      expect(func).to.throw()
    })
  })
})
