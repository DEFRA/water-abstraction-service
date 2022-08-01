'use strict'

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const uuid = require('uuid/v4')

const ReturnRequirementPurpose = require('../../../src/lib/models/return-requirement-purpose')
const PurposeUse = require('../../../src/lib/models/purpose-use')

class TestModel { };

experiment('lib/models/return-requirement-purpose', () => {
  let returnRequirementPurpose

  beforeEach(async () => {
    returnRequirementPurpose = new ReturnRequirementPurpose()
  })

  experiment('.id', () => {
    test('can be set to a GUID', async () => {
      const id = uuid()
      returnRequirementPurpose.id = id
      expect(returnRequirementPurpose.id).to.equal(id)
    })

    test('throws an error if set to null', async () => {
      const func = () => {
        returnRequirementPurpose.id = null
      }
      expect(func).to.throw()
    })

    test('throws an error if set to a non-guid', async () => {
      const func = () => {
        returnRequirementPurpose.id = 'not-a-guid'
      }
      expect(func).to.throw()
    })
  })

  experiment('.purposeUse', () => {
    test('can be set to a PurposeUse model', async () => {
      const purposeUse = new PurposeUse()
      returnRequirementPurpose.purposeUse = purposeUse
      expect(returnRequirementPurpose.purposeUse).to.equal(purposeUse)
    })

    test('throws an error if set to a different model', async () => {
      const func = () => {
        returnRequirementPurpose.purposeUse = new TestModel()
      }
      expect(func).to.throw()
    })

    test('throws an error if set to null', async () => {
      const func = () => {
        returnRequirementPurpose.purposeUse = null
      }
      expect(func).to.throw()
    })
  })

  experiment('.purposeAlias', () => {
    test('can be set to null', async () => {
      returnRequirementPurpose.purposeAlias = null
      expect(returnRequirementPurpose.purposeAlias).to.equal(null)
    })

    test('can be set to a string value', async () => {
      returnRequirementPurpose.purposeAlias = 'test'
      expect(returnRequirementPurpose.purposeAlias).to.equal('test')
    })

    test('throws an error if set to a number', async () => {
      const func = () => { returnRequirementPurpose.purposeAlias = 123 }
      expect(func).to.throw()
    })
  })
})
