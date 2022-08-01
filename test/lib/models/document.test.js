'use strict'

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const Document = require('../../../src/lib/models/document')
const DateRange = require('../../../src/lib/models/date-range')
const Role = require('../../../src/lib/models/role')

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580'

class TestModel {};

experiment('lib/models/document', () => {
  let document

  beforeEach(async () => {
    document = new Document()
  })

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      document.id = TEST_GUID
      expect(document.id).to.equal(TEST_GUID)
    })

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        document.id = 'hey'
      }
      expect(func).to.throw()
    })
  })

  experiment('.dateRange', () => {
    test('can be set to a DateRange instance', async () => {
      const dateRange = new DateRange('2019-09-01', null)
      document.dateRange = dateRange
      expect(document.dateRange).to.equal(dateRange)
    })

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        document.dateRange = new TestModel()
      }
      expect(func).to.throw()
    })
  })

  experiment('.status', () => {
    ['current', 'draft', 'superseded'].forEach(status => {
      test(`can be set to "${status}"`, async () => {
        document.status = status
        expect(document.status).to.equal(status)
      })
    })

    test('throws an error if set to a different status', async () => {
      const func = () => {
        document.status = 'not-a-valid-status'
      }
      expect(func).to.throw()
    })
  })

  experiment('.versionNumber', () => {
    test('can be set to a positive integer', async () => {
      document.versionNumber = 1
      expect(document.versionNumber).to.equal(1)
    })

    test('throws an error if set to a different type', async () => {
      const func = () => {
        document.versionNumber = 'not-an-integer'
      }
      expect(func).to.throw()
    })

    test('throws an error if set to zero', async () => {
      const func = () => {
        document.versionNumber = 0
      }
      expect(func).to.throw()
    })

    test('throws an error if set to a negative integer', async () => {
      const func = () => {
        document.versionNumber = -56
      }
      expect(func).to.throw()
    })

    test('throws an error if set to a float', async () => {
      const func = () => {
        document.versionNumber = 44.23
      }
      expect(func).to.throw()
    })
  })

  experiment('.roles', () => {
    test('can be set to an array of Role models', async () => {
      const roles = [new Role()]
      document.roles = roles
      expect(document.roles).to.equal(roles)
    })

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        const notRoles = [new TestModel()]
        document.roles = notRoles
      }
      expect(func).to.throw()
    })
  })

  experiment('.getRoleOnDate', () => {
    const createRole = (roleName, startDate, endDate) => {
      const role = new Role()
      return role.fromHash({
        roleName,
        dateRange: new DateRange(startDate, endDate)
      })
    }

    beforeEach(async () => {
      document.roles = [
        createRole('licenceHolder', '2019-01-01', '2020-01-01'),
        createRole('billing', '2019-01-01', '2020-01-01'),
        createRole('licenceHolder', '2020-01-02', null),
        createRole('billing', '2020-01-02', null)
      ]
    })

    test('gets the role on the given date', async () => {
      const role = document.getRoleOnDate('licenceHolder', '2020-02-01')
      expect(role).to.equal(document.roles[2])
    })
  })

  experiment('.licenceNumber', () => {
    const LICENCE_NUMBER = '01/234/567/89'

    test('can be set to a valid licence number', async () => {
      document.licenceNumber = LICENCE_NUMBER
      expect(document.licenceNumber).to.equal(LICENCE_NUMBER)
    })

    test('throws an error if set to null', async () => {
      const func = () => {
        document.licenceNumber = null
      }
      expect(func).to.throw()
    })

    test('throws an error if set to an invalid licence number', async () => {
      const func = () => {
        document.licenceNumber = '01/123/£$'
      }
      expect(func).to.throw()
    })
  })
})
