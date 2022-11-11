'use strict'

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const { v4: uuid } = require('uuid')

const AbstractionPeriod = require('../../../src/lib/models/abstraction-period')
const DateRange = require('../../../src/lib/models/date-range')
const PurposeUse = require('../../../src/lib/models/purpose-use')
const Return = require('../../../src/lib/models/return')
const ReturnVersion = require('../../../src/lib/models/return-version')
const config = require('../../../config')
const sandbox = require('sinon').createSandbox()

class TestModel { };

experiment('lib/models/return', () => {
  let ret

  beforeEach(async () => {
    ret = new Return()
    sandbox.stub(config.billing, 'returnsGracePeriod').value(21)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.id', () => {
    test('can be set to a return ID string', async () => {
      const returnId = 'v1:1:01/123/456/789:12345678:2019-04-01:2020-03-31'
      ret.id = returnId
      expect(ret.id).to.equal(returnId)
    })

    test('throws an error if set to null', async () => {
      const func = () => {
        ret.id = null
      }
      expect(func).to.throw()
    })

    test('throws an error if set to a non-return ID string', async () => {
      const func = () => {
        ret.id = uuid()
      }
      expect(func).to.throw()
    })
  })

  experiment('.dateRange', () => {
    test('can be set to a DateRange instance', async () => {
      const dateRange = new DateRange('2019-09-01', null)
      ret.dateRange = dateRange
      expect(ret.dateRange).to.equal(dateRange)
    })

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        ret.dateRange = new TestModel()
      }
      expect(func).to.throw()
    })
  })

  experiment('.purposeUses', () => {
    test('throws an error if set', async () => {
      const func = () => {
        ret.purposeUses = [new PurposeUse()]
      }
      expect(func).to.throw()
    })

    test('throws an error if not an array', async () => {
      const func = () => {
        const notAnArray = new PurposeUse()
        ret.purposeUses = notAnArray
      }
      expect(func).to.throw()
    })

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        const notPurposeUses = [new TestModel()]
        ret.purposeUses = notPurposeUses
      }
      expect(func).to.throw()
    })
  })

  experiment('.isSummer', () => {
    test('can be set to a boolean true', async () => {
      ret.isSummer = true
      expect(ret.isSummer).to.equal(true)
    })

    test('can be set to a boolean false', async () => {
      ret.isSummer = false
      expect(ret.isSummer).to.equal(false)
    })

    test('throws an error if set to a different type', async () => {
      const func = () => {
        ret.isSummer = 'not-a-boolean'
      }
      expect(func).to.throw()
    })
  })

  experiment('.isUnderQuery', () => {
    test('can be set to a boolean true', async () => {
      ret.isUnderQuery = true
      expect(ret.isUnderQuery).to.equal(true)
    })

    test('can be set to a boolean false', async () => {
      ret.isUnderQuery = false
      expect(ret.isUnderQuery).to.equal(false)
    })

    test('throws an error if set to a different type', async () => {
      const func = () => {
        ret.isUnderQuery = 'not-a-boolean'
      }
      expect(func).to.throw()
    })
  })

  experiment('.dueDate', () => {
    test('can be set to a date string', async () => {
      ret.dueDate = '2019-11-28'
      expect(ret.dueDate).to.equal('2019-11-28')
    })

    test('throws an error if set to an invalid date', async () => {
      const func = () => {
        ret.dueDate = '2020-13-01'
      }
      expect(func).to.throw()
    })

    test('throws an error if set to null', async () => {
      const func = () => {
        ret.dueDate = null
      }
      expect(func).to.throw()
    })
  })

  experiment('.receivedDate', () => {
    test('can be set to a date string', async () => {
      ret.receivedDate = '2019-11-28'
      expect(ret.receivedDate).to.equal('2019-11-28')
    })

    test('can be set to null', async () => {
      ret.receivedDate = null
      expect(ret.receivedDate).to.equal(null)
    })

    test('throws an error if set to an invalid date', async () => {
      const func = () => {
        ret.receivedDate = '2020-13-01'
      }
      expect(func).to.throw()
    })
  })

  experiment('.isLateForBilling', () => {
    test('is false if the return is received on time', async () => {
      ret.dueDate = '2019-11-28'
      ret.receivedDate = '2019-11-05'
      expect(ret.isLateForBilling).to.equal(false)
    })

    test('is false if the return is received on the due date', async () => {
      ret.dueDate = '2019-11-28'
      ret.receivedDate = '2019-11-28'
      expect(ret.isLateForBilling).to.equal(false)
    })

    test('is false if the return is received 3 weeks past the due date', async () => {
      ret.dueDate = '2019-11-28'
      ret.receivedDate = '2019-12-19'
      expect(ret.isLateForBilling).to.equal(false)
    })

    test('is true if the return is received >3 weeks past the due date', async () => {
      ret.dueDate = '2019-11-28'
      ret.receivedDate = '2019-12-20'
      expect(ret.isLateForBilling).to.equal(true)
    })

    test('is undefined if the return received date is not set', async () => {
      ret.dueDate = '2019-11-28'
      expect(ret.isLateForBilling).to.equal(undefined)
    })
  })

  experiment('.isDueForBilling', () => {
    test('returns false if the date is before the due date + 3 week grace period', async () => {
      ret.dueDate = '2019-11-28'
      expect(ret.isDueForBilling('2019-12-18')).to.be.false()
    })

    test('returns true if the date is after the due date + 3 week grace period', async () => {
      ret.dueDate = '2019-11-28'
      expect(ret.isDueForBilling('2019-12-19')).to.be.true()
    })
  })

  experiment('.status', () => {
    const returnStatuses = ['due', 'received', 'completed', 'void']

    for (const status of returnStatuses) {
      test(`can be set to ${status}`, async () => {
        ret.status = status
        expect(ret.status).to.equal(status)
      })
    }

    test('throws an error if set to null', async () => {
      const func = () => {
        ret.status = null
      }
      expect(func).to.throw()
    })

    test('throws an error if set to an invalid status', async () => {
      const func = () => {
        ret.status = 'dog-ate-it'
      }
      expect(func).to.throw()
    })
  })

  experiment('.returnVersions', () => {
    test('can be set to an array of purpose uses', async () => {
      const returnVersions = [new ReturnVersion()]
      ret.returnVersions = returnVersions
      expect(ret.returnVersions).to.equal(returnVersions)
    })

    test('throws an error if not an array', async () => {
      const func = () => {
        const notAnArray = new ReturnVersion()
        ret.returnVersions = notAnArray
      }
      expect(func).to.throw()
    })

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        const notReturnVersions = [new TestModel()]
        ret.returnVersions = notReturnVersions
      }
      expect(func).to.throw()
    })
  })

  experiment('.currentReturnVersion', () => {
    beforeEach(async () => {
      ret.returnVersions = [
        new ReturnVersion(uuid()),
        new ReturnVersion(uuid()),
        new ReturnVersion(uuid())
      ]
    })

    test('gets the current return version when present', async () => {
      ret.returnVersions[1].isCurrentVersion = true
      expect(ret.currentReturnVersion).to.equal(ret.returnVersions[1])
    })

    test('returns undefined when there is no current return version', async () => {
      expect(ret.currentReturnVersion).to.equal(undefined)
    })
  })

  experiment('.abstractionPeriod', () => {
    test('can be set to an AbstractionPeriod instance', async () => {
      ret.abstractionPeriod = new AbstractionPeriod()
      expect(ret.abstractionPeriod instanceof AbstractionPeriod).to.be.true()
    })

    test('can be set to null', async () => {
      ret.abstractionPeriod = null
      expect(ret.abstractionPeriod).to.be.null()
    })

    test('throws an error if set to a different model', async () => {
      const func = () => {
        ret.abstractionPeriod = new TestModel()
      }
      expect(func).to.throw()
    })
  })

  experiment('.RETURN_STATUS', () => {
    test('defines the return statuses', async () => {
      const { RETURN_STATUS } = Return
      expect(Object.keys(RETURN_STATUS).length).to.equal(4)
      expect(RETURN_STATUS.completed).to.equal('completed')
      expect(RETURN_STATUS.due).to.equal('due')
      expect(RETURN_STATUS.received).to.equal('received')
      expect(RETURN_STATUS.void).to.equal('void')
    })
  })
})
