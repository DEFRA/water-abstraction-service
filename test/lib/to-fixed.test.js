'use strict'

const { experiment, test } = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')

const toFixed = require('../../src/lib/to-fixed')

experiment('lib/unit-conversion', () => {
  experiment('cubicMetresToMegalitres', () => {
    test('handles null', async () => {
      expect(toFixed(null)).to.equal(null)
    })

    test('converts decimals to the specified number of decimal places', async () => {
      expect(toFixed(1.12345, 3)).to.equal('1.123')
    })
  })
})
