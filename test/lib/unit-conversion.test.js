'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const unitConversion = require('../../src/lib/unit-conversion');

experiment('lib/unit-conversion', () => {
  experiment('cubicMetresToMegalitres', () => {
    test('handles null', async () => {
      expect(unitConversion.cubicMetresToMegalitres(null)).to.equal(null);
    });

    test('converts values in cubic litres to megalitres', async () => {
      expect(unitConversion.cubicMetresToMegalitres(1004.23)).to.equal(1.00423);
    });
  });
});
