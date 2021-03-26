'use strict';
const Decimal = require('decimal.js-light');
const { isNull } = require('lodash');

const cubicMetresToMegalitres = value => {
  if (isNull(value)) {
    return 0;
  }
  return new Decimal(value).dividedBy(1000).toNumber();
};

exports.cubicMetresToMegalitres = cubicMetresToMegalitres;
