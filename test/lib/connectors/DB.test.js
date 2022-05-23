'use strict';

require('dotenv').config();

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const knex = require('../../../src/lib/connectors/knex.js');
const db = require('../../../src/lib/connectors/db.js');

experiment('src/lib/connectors/db', () => {
  beforeEach(async () => {
    sandbox.stub(knex.knex, 'raw');
    sandbox.stub(knex.knex, 'destroy');
  });

  afterEach(async () => {
    sandbox.restore();
  });
  experiment('.query', () => {
    test('when there are no params', async () => {
      const QUERY = 'select some_column from some_table';
      await db.pool.query(QUERY);
      expect(knex.knex.raw.calledWith(QUERY)).to.be.true();
    });

    test('when there are bound params', async () => {
      const QUERY = 'select * from some_table where column_a=$1 and column_b=$2 order by column_a=$1';
      const PARAMS = ['foo', 'bar'];
      await db.pool.query(QUERY, PARAMS);
      expect(knex.knex.raw.calledWith(
        'select * from some_table where column_a=:param_0 and column_b=:param_1 order by column_a=:param_0',
        {
          param_0: PARAMS[0],
          param_1: PARAMS[1]
        }
      )).to.be.true();
    });
  });

  experiment('.end', () => {
    test('calls knex.destroy()', async () => {
      await db.pool.end();
      expect(knex.knex.destroy.callCount).to.equal(1);
    });
  });
});
