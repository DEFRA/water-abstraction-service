require('dotenv').config();
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');
const sandbox = require('sinon').createSandbox();
const { load } = require('../../../src/modules/import/load.js');
const { pool } = require('../../../src/lib/connectors/db');

class DbError extends Error {
  constructor (message, code) {
    super(message);
    this.name = 'error';
    this.code = code;
  }
}

lab.experiment('Test error handling of licence loader if DB error', () => {
  lab.test('Ensure DB error in licence load bubbles correctly', async () => {
    const query = sandbox.stub(pool, 'query');
    query.throws(new DbError('DB snag', '42P01'));
    try {
      await load('19/55/9/0349');
    } catch (err) {
      expect(err.code).to.equal('42P01');
    }
    sandbox.restore();
  });
});

exports.lab = lab;
