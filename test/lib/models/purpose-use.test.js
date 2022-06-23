'use strict'

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const PurposeUse = require('../../../src/lib/models/purpose-use')
const { LOSSES } = require('../../../src/lib/models/constants')

experiment('lib/models/purpose-use', () => {
  let purpose

  experiment('constructor', () => {
    test('can be called with no arguments', async () => {
      purpose = new PurposeUse()
      expect(purpose.id).to.be.undefined()
    })
  })

  experiment('properties', () => {
    beforeEach(async () => {
      purpose = new PurposeUse()
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

    experiment('lossFactor', () => {
      Object.values(LOSSES).forEach(loss => {
        test(`can be set to ${loss}`, async () => {
          purpose.lossFactor = loss
          expect(purpose.lossFactor).to.equal(loss)
        })
      })

      test('cannot be a value not in the LOSSES constant', async () => {
        expect(() => {
          purpose.lossFactor = 'Goose'
        }).to.throw()
      })
    })

    experiment('isTwoPartTariff', () => {
      test('cannot be a string', async () => {
        expect(() => {
          purpose.isTwoPartTariff = 'Goose'
        }).to.throw()
      })

      test('can be set to true', async () => {
        purpose.isTwoPartTariff = true
        expect(purpose.isTwoPartTariff).to.equal(true)
      })

      test('can be set to false', async () => {
        purpose.isTwoPartTariff = false
        expect(purpose.isTwoPartTariff).to.equal(false)
      })
    })
  })
})
