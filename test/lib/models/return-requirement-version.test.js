'use strict'

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const uuid = require('uuid/v4')

const ReturnRequirementVersion = require('../../../src/lib/models/return-requirement-version')
const ReturnRequirement = require('../../../src/lib/models/return-requirement')
const ReturnRequirementPurpose = require('../../../src/lib/models/return-requirement-purpose')

const DateRange = require('../../../src/lib/models/date-range')
const PurposeUse = require('../../../src/lib/models/purpose-use')
const { RETURN_SEASONS } = require('../../../src/lib/models/constants')

class TestModel { };

experiment('lib/models/return-requirement-version', () => {
  let returnRequirementVersion

  beforeEach(async () => {
    returnRequirementVersion = new ReturnRequirementVersion()
  })

  experiment('.id', () => {
    test('can be set to a GUID', async () => {
      const id = uuid()
      returnRequirementVersion.id = id
      expect(returnRequirementVersion.id).to.equal(id)
    })

    test('throws an error if set to null', async () => {
      const func = () => {
        returnRequirementVersion.id = null
      }
      expect(func).to.throw()
    })

    test('throws an error if set to a non-guid', async () => {
      const func = () => {
        returnRequirementVersion.id = 'not-a-guid'
      }
      expect(func).to.throw()
    })
  })

  experiment('.dateRange', () => {
    test('can be set to a DateRange model', async () => {
      const dateRange = new DateRange()
      returnRequirementVersion.dateRange = dateRange
      expect(returnRequirementVersion.dateRange).to.equal(dateRange)
    })

    test('throws an error if set to a different model', async () => {
      const func = () => {
        returnRequirementVersion.dateRange = new TestModel()
      }
      expect(func).to.throw()
    })

    test('throws an error if set to null', async () => {
      const func = () => {
        returnRequirementVersion.dateRange = null
      }
      expect(func).to.throw()
    })
  })

  experiment('.status', () => {
    ['draft', 'current', 'superseded'].forEach(status => {
      test(`can be set to ${status}`, async () => {
        returnRequirementVersion.status = status
        expect(returnRequirementVersion.status).to.equal(status)
      })
    })

    test('throws an error if set to an invalid status', async () => {
      const func = () => {
        returnRequirementVersion.status = 'not-a-status'
      }
      expect(func).to.throw()
    })

    test('throws an error if set to null', async () => {
      const func = () => {
        returnRequirementVersion.status = null
      }
      expect(func).to.throw()
    })
  })

  experiment('.isNotDraft', () => {
    ['current', 'superseded'].forEach(status => {
      test(`returns true when status is ${status}`, async () => {
        returnRequirementVersion.status = status
        expect(returnRequirementVersion.isNotDraft).to.be.true()
      })
    })

    test('returns false when status is draft', async () => {
      returnRequirementVersion.status = 'draft'
      expect(returnRequirementVersion.isNotDraft).to.be.false()
    })
  })

  experiment('.returnRequirements', () => {
    test('can be set to an array of ReturnRequirement models', async () => {
      const returnRequirements = [new ReturnRequirement()]
      returnRequirementVersion.returnRequirements = returnRequirements
      expect(returnRequirementVersion.returnRequirements).to.equal(returnRequirements)
    })

    test('throws an error if not an array', async () => {
      const func = () => {
        const notAnArray = new ReturnRequirement()
        returnRequirementVersion.returnRequirements = notAnArray
      }
      expect(func).to.throw()
    })

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        const notReturnRequirements = [new TestModel()]
        returnRequirementVersion.returnRequirements = notReturnRequirements
      }
      expect(func).to.throw()
    })
  })

  experiment('.hasTwoPartTariffPurposeReturnsInSeason', () => {
    const createReturnRequirementPurpose = isTwoPartTariff => {
      const returnRequirementPurpose = new ReturnRequirementPurpose()
      returnRequirementPurpose.purposeUse = new PurposeUse()
      returnRequirementPurpose.purposeUse.fromHash({
        isTwoPartTariff
      })
      return returnRequirementPurpose
    }

    const createReturnRequirement = (isSummer, isTwoPartTariff) => {
      const returnRequirement = new ReturnRequirement()
      return returnRequirement.fromHash({
        isSummer,
        returnRequirementPurposes: [
          createReturnRequirementPurpose(false),
          createReturnRequirementPurpose(isTwoPartTariff),
          createReturnRequirementPurpose(false)
        ]
      })
    }

    experiment('for summer', () => {
      test('returns false if there are no summer two-part returns', async () => {
        returnRequirementVersion.returnRequirements = [
          createReturnRequirement(true, false),
          createReturnRequirement(false, true)
        ]
        expect(returnRequirementVersion.hasTwoPartTariffPurposeReturnsInSeason(RETURN_SEASONS.summer)).to.be.false()
      })

      test('returns true if there are summer two-part returns', async () => {
        returnRequirementVersion.returnRequirements = [
          createReturnRequirement(false, false),
          createReturnRequirement(true, true)
        ]
        expect(returnRequirementVersion.hasTwoPartTariffPurposeReturnsInSeason(RETURN_SEASONS.summer)).to.be.true()
      })
    })

    experiment('for winter/all year', () => {
      test('returns false if there are no winter/all year two-part returns', async () => {
        returnRequirementVersion.returnRequirements = [
          createReturnRequirement(true, true),
          createReturnRequirement(false, false)
        ]
        expect(returnRequirementVersion.hasTwoPartTariffPurposeReturnsInSeason(RETURN_SEASONS.winterAllYear)).to.be.false()
      })

      test('returns true if there are winter/all two-part returns', async () => {
        returnRequirementVersion.returnRequirements = [
          createReturnRequirement(true, true),
          createReturnRequirement(false, true)
        ]
        expect(returnRequirementVersion.hasTwoPartTariffPurposeReturnsInSeason(RETURN_SEASONS.winterAllYear)).to.be.true()
      })
    })
  })
})
