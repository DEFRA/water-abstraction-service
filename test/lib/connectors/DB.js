'use strict'
require('dotenv').config()

// See Code API ref at https://github.com/hapijs/code/blob/HEAD/API.md

// requires for testing
const Code = require('code')

const expect = Code.expect
const Lab = require('lab')
const lab = Lab.script()

// use some BDD verbage instead of lab default
const describe = lab.describe
const it = lab.it
const after = lab.after

const db = require('../../../src/lib/connectors/db.js')
// tests
lab.experiment('Test Database Connection', () => {
  lab.test('should return data', async() => {
      // make API call to self to test functionality end-to-end
      const {error, rows} = await db.query('select 1');

      Code.expect(error).to.equal(null);

      return;
  })
})




exports.lab = lab;
