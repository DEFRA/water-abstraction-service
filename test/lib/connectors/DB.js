'use strict';

require('dotenv').config();

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const { pool } = require('../../../src/lib/connectors/db.js');

experiment('result object', () => {
  test('has data when no error', async () => {
    const res = await pool.query('select 1 as test_one');
    expect(res.rows).to.equal([
      { test_one: 1 }
    ]);
  });

  test('has error details when an error occurs', async () => {
    const query = `
      select 1
      from non_existent_schema.non_existent_table;`;

    const func = () => pool.query(query);

    expect(func()).to.reject();
  });
});
