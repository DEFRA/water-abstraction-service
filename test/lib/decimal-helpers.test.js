'use strict'

const { experiment, test } = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const Decimal = require('decimal.js-light')

const decimalHelpers = require('../../src/lib/decimal-helpers')

const a = new Decimal(-2.42)
const b = new Decimal(3.45)
const c = new Decimal(0)

experiment('lib/decimal-helpers', () => {
  experiment('.min', () => {
    test('returns the value when there is a single value', async () => {
      const result = decimalHelpers.min(
        a
      )
      expect(result).to.equal(a)
    })

    test('returns the smallest decimal from a set of decimals', async () => {
      const result = decimalHelpers.min(
        a, b, c
      )
      expect(result).to.equal(a)
    })
  })

  experiment('.max', () => {
    test('returns the value when there is a single value', async () => {
      const result = decimalHelpers.max(
        b
      )
      expect(result).to.equal(b)
    })

    test('returns the greatest decimal from a set of decimals', async () => {
      const result = decimalHelpers.max(
        a, b, c
      )
      expect(result).to.equal(b)
    })
  })

  experiment('.isDecimal', () => {
    test('returns true for an instance of Decimal', async () => {
      expect(decimalHelpers.isDecimal(a)).to.be.true()
    })

    test('returns false for another object', async () => {
      expect(decimalHelpers.isDecimal({})).to.be.false()
    })

    test('returns false for null', async () => {
      expect(decimalHelpers.isDecimal(null)).to.be.false()
    })
  })
})
