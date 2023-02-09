'use strict'
const Decimal = require('decimal.js-light')

const cubicMetresToMegalitres = value => {
  if (value === null) {
    return null
  }
  return new Decimal(value).dividedBy(1000).toNumber()
}

exports.cubicMetresToMegalitres = cubicMetresToMegalitres
