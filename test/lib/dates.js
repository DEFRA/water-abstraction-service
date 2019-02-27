const { expect } = require('code');
const {
  experiment,
  test
} = exports.lab = require('lab').script();

const dates = require('../../src/lib/dates');

experiment('ukDateToISO', () => {
  test('returns null for invalid date', async () => {
    expect(dates.ukDateToISO('nope')).to.be.null();
  });

  test('converts the date as expected', async () => {
    expect(dates.ukDateToISO('28/02/2018')).to.equal('2018-02-28');
  });
});
