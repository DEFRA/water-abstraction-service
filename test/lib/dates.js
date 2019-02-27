const { expect } = require('code');
const {
  experiment,
  test
} = exports.lab = require('lab').script();

const dates = require('../../src/lib/dates');

experiment('dateToIsoString', () => {
  test('returns null for invalid date', async () => {
    expect(dates.dateToIsoString('nope')).to.be.null();
  });

  test('converts the date as expected', async () => {
    expect(dates.dateToIsoString('28/02/2018')).to.equal('2018-02-28');
  });
});

experiment('dateToSortableString', () => {
  test('returns null for invalid date', async () => {
    expect(dates.dateToSortableString('nope')).to.be.null();
  });

  test('converts the date as expected', async () => {
    expect(dates.dateToSortableString('28/02/2018')).to.equal('20180228');
  });
});

experiment('returnsDateToIso', () => {
  test('returns null for invalid date', async () => {
    expect(dates.returnsDateToIso('nope')).to.be.null();
  });

  test('converts the date as expected', async () => {
    expect(dates.returnsDateToIso('20180122')).to.equal('2018-01-22');
  });
});
