'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const moment = require('moment');

const dates = require('../../src/lib/dates');

experiment('lib/dates', () => {
  experiment('formatDate', () => {
    test('handles null', async () => {
      expect(dates.formatDate(null)).to.equal(null);
    });

    test('handles a moment', async () => {
      const date = moment('2000-01-01');
      expect(dates.formatDate(date)).to.equal('2000-01-01');
    });

    test('handles a string', async () => {
      const date = '2000-01-02';
      expect(dates.formatDate(date)).to.equal('2000-01-02');
    });
  });
});
