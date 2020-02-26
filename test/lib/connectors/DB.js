'use strict';

require('dotenv').config();

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const { pool, _dateMapper } = require('../../../src/lib/connectors/db.js');

experiment('src/lib/connectors/db', () => {
  experiment('pool.query', () => {
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

  experiment('._dateMapper', () => {
    test('maps dates to ISO 8601 format', async () => {
      const result = _dateMapper('2020-03-05');
      expect(result).to.equal('2020-03-05');
    });
  });
});
