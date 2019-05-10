'use strict';

require('dotenv').config();

const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const db = require('../../../src/lib/connectors/db.js');

experiment('Test Database Connection', () => {
  test('should return data', async () => {
    // make API call to self to test functionality end-to-end
    const res = await db.query('select 1');
    expect(res.error).to.be.undefined();
  });
});
