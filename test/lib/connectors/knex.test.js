'use strict';

require('dotenv').config();

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const { _dateMapper } = require('../../../src/lib/connectors/knex.js');

experiment('src/lib/connectors/knex', () => {
  experiment('._dateMapper', () => {
    test('maps dates to ISO 8601 format', async () => {
      const result = _dateMapper('2020-03-05');
      expect(result).to.equal('2020-03-05');
    });
  });
});
