'use strict';

require('dotenv').config();

const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const db = require('../../../src/lib/connectors/db.js');

experiment('result object', () => {
  test('has data when no error', async () => {
    const res = await db.query('select 1 as test_one');
    expect(res).to.equal({
      data: [
        { test_one: 1 }
      ],
      error: null
    });
  });

  test('has error details when an error occurs', async () => {
    const query = `
      select 1
      from non_existent_schema.non_existent_table;`;

    const res = await db.query(query);
    expect(res.data).to.be.null();
    expect(res.error).not.to.be.null();
  });
});
