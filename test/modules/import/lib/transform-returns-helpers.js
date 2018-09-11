const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const {
  convertNullStrings,
  mapPeriod,
  mapReceivedDate,
  getReturnCycles,
  getPeriodStart,
  addDate,
  getStatus
} = require('../../../../src/modules/import/lib/transform-returns-helpers');

lab.experiment('Test returns data transformation helpers', () => {
  lab.test('Test convert null strings on shallow object', async () => {
    const obj = {
      name: 'Test',
      date: 'null',
      unit: 'm',
      quantity: 1234.25
    };

    const result = convertNullStrings(obj);

    expect(result).to.equal({
      name: 'Test',
      date: null,
      unit: 'm',
      quantity: 1234.25
    });
  });

  lab.test('Test mapping of NALD returns periods codes', async () => {
    expect(mapPeriod('D')).to.equal('day');
    expect(mapPeriod('W')).to.equal('week');
    expect(mapPeriod('M')).to.equal('month');
    expect(mapPeriod('Q')).to.equal('quarter');
    expect(mapPeriod('A')).to.equal('year');
    expect(mapPeriod('x')).to.equal(undefined);
  });

  lab.test('Test mapReceivedDate with no logs', async () => {
    const logs = [];

    expect(mapReceivedDate(logs)).to.equal(null);
  });

  lab.test('Test mapReceivedDate with a null string value', async () => {
    const logs = [{ RECD_DATE: '01/01/2017' }, { RECD_DATE: 'null' }];

    expect(mapReceivedDate(logs)).to.equal(null);
  });

  lab.test('Test mapReceivedDate with valiid dates', async () => {
    const logs = [{ RECD_DATE: '25/12/2017' }, { RECD_DATE: '04/01/2017' }];

    expect(mapReceivedDate(logs)).to.equal('2017-12-25');
  });

  // ---------- getNextPeriodStart - financial
  lab.test('getNextPeriodStart for financial year return in same year', async () => {
    expect(getPeriodStart('2018-05-01')).to.equal('2018-04-01');
  });
  lab.test('getNextPeriodStart for financial year return in different year', async () => {
    expect(getPeriodStart('2018-02-01')).to.equal('2017-04-01');
  });
  lab.test('getNextPeriodStart for financial year return on period start date', async () => {
    expect(getPeriodStart('2018-04-01')).to.equal('2018-04-01');
  });
  lab.test('getNextPeriodStart for financial year return on period end date', async () => {
    expect(getPeriodStart('2018-03-31')).to.equal('2017-04-01');
  });

  // ---------- getNextPeriodStart - summer
  lab.test('getNextPeriodStart for summer year return in same year', async () => {
    expect(getPeriodStart('2018-12-01', true)).to.equal('2018-11-01');
  });
  lab.test('getNextPeriodStart for summer year return in different year', async () => {
    expect(getPeriodStart('2018-02-01', true)).to.equal('2017-11-01');
  });
  lab.test('getNextPeriodStart for summer year return on period start date', async () => {
    expect(getPeriodStart('2018-11-01', true)).to.equal('2018-11-01');
  });
  lab.test('getNextPeriodStart for summer year return on period end date', async () => {
    expect(getPeriodStart('2018-10-31', true)).to.equal('2017-11-01');
  });

  // ---------- addDate
  lab.test('addDate - add a date if within range', async () => {
    expect(addDate([], '2018-12-01', '2018-01-01', '2018-12-31')).to.equal(['2018-12-01']);
  });
  lab.test('addDate - dont add a date if before start date', async () => {
    expect(addDate([], '2017-12-01', '2018-01-01', '2018-12-31')).to.equal([]);
  });
  lab.test('addDate - dont add a date if after end date', async () => {
    expect(addDate([], '2018-12-05', '2018-01-01', '2018-11-31')).to.equal([]);
  });
  lab.test('addDate - dont add a date if on start date', async () => {
    expect(addDate([], '2017-12-01', '2017-12-01', '2018-12-31')).to.equal([]);
  });
  lab.test('addDate - dont add a date if on end date', async () => {
    expect(addDate([], '2018-11-31', '2018-01-01', '2018-11-31')).to.equal([]);
  });
  lab.test('addDate - dont add duplicate dates', async () => {
    let dates = [];
    dates = addDate(dates, '2018-12-01', '2018-01-01', '2018-12-31');
    dates = addDate(dates, '2018-12-01', '2018-01-01', '2018-12-31');
    expect(dates).to.equal(['2018-12-01']);
  });

  // ---------- getReturnCycles - financial year
  lab.test('getReturnCycles - single financial year, current version', async () => {
    const cycles = getReturnCycles('2014-04-01', '2015-03-31', '2014-04-01', false);
    expect(cycles).to.equal([{
      startDate: '2014-04-01',
      endDate: '2015-03-31',
      isCurrent: true
    }]);
  });
  lab.test('getReturnCycles - single financial year, expired version', async () => {
    const cycles = getReturnCycles('2014-04-01', '2015-03-31', '2016-04-01', false);
    expect(cycles).to.equal([{
      startDate: '2014-04-01',
      endDate: '2015-03-31',
      isCurrent: false
    }]);
  });
  lab.test('getReturnCycles - part financial years, current version', async () => {
    const cycles = getReturnCycles('2014-06-01', '2015-07-01', '2010-04-01', false);
    expect(cycles).to.equal([
      { startDate: '2014-06-01',
        endDate: '2015-03-31',
        isCurrent: true },
      { startDate: '2015-04-01',
        endDate: '2015-07-01',
        isCurrent: true } ]);
  });

  lab.test('getReturnCycles - part financial years, expired version', async () => {
    const cycles = getReturnCycles('2014-06-01', '2015-07-01', '2018-04-01', false);
    expect(cycles).to.equal([
      { startDate: '2014-06-01',
        endDate: '2015-03-31',
        isCurrent: false },
      { startDate: '2015-04-01',
        endDate: '2015-07-01',
        isCurrent: false } ]);
  });

  lab.test('getReturnCycles - part financial years, expiry on period start', async () => {
    const cycles = getReturnCycles('2014-06-01', '2015-07-01', '2015-04-01', false);
    expect(cycles).to.equal([
      { startDate: '2014-06-01',
        endDate: '2015-03-31',
        isCurrent: false },
      { startDate: '2015-04-01',
        endDate: '2015-07-01',
        isCurrent: true } ]);
  });

  lab.test('getReturnCycles - part financial years, expiry part-way through period', async () => {
    const cycles = getReturnCycles('2014-06-01', '2015-07-01', '2015-06-01', false);
    expect(cycles).to.equal([
      { startDate: '2014-06-01',
        endDate: '2015-03-31',
        isCurrent: false },
      { startDate: '2015-04-01',
        endDate: '2015-05-31',
        isCurrent: false },
      { startDate: '2015-06-01',
        endDate: '2015-07-01',
        isCurrent: true } ]);
  });

  // ---------- getReturnCycles - summer year
  lab.test('getReturnCycles - single summer year, current version', async () => {
    const cycles = getReturnCycles('2014-11-01', '2015-10-31', '2014-11-01', true);
    expect(cycles).to.equal([{
      startDate: '2014-11-01',
      endDate: '2015-10-31',
      isCurrent: true
    }]);
  });
  lab.test('getReturnCycles - single summer year, expired version', async () => {
    const cycles = getReturnCycles('2014-11-01', '2015-10-31', '2016-04-01', true);
    expect(cycles).to.equal([{
      startDate: '2014-11-01',
      endDate: '2015-10-31',
      isCurrent: false
    }]);
  });
  lab.test('getReturnCycles - part summer years, current version', async () => {
    const cycles = getReturnCycles('2014-06-01', '2015-12-01', '2010-04-01', true);
    expect(cycles).to.equal([
      { startDate: '2014-06-01',
        endDate: '2014-10-31',
        isCurrent: true },
      { startDate: '2014-11-01',
        endDate: '2015-10-31',
        isCurrent: true },
      { startDate: '2015-11-01',
        endDate: '2015-12-01',
        isCurrent: true } ]);
  });

  lab.test('getReturnCycles - part summer years, expired version', async () => {
    const cycles = getReturnCycles('2014-06-01', '2015-07-01', '2018-04-01', true);

    expect(cycles).to.equal([
      { startDate: '2014-06-01',
        endDate: '2014-10-31',
        isCurrent: false },
      { startDate: '2014-11-01',
        endDate: '2015-07-01',
        isCurrent: false } ]);
  });

  lab.test('getReturnCycles - part summer years, expiry on period start', async () => {
    const cycles = getReturnCycles('2014-06-01', '2016-07-01', '2015-11-01', true);

    expect(cycles).to.equal([
      { startDate: '2014-06-01',
        endDate: '2014-10-31',
        isCurrent: false },
      { startDate: '2014-11-01',
        endDate: '2015-10-31',
        isCurrent: false },
      { startDate: '2015-11-01',
        endDate: '2016-07-01',
        isCurrent: true } ]);
  });

  lab.test('getReturnCycles - part summer years, expiry part-way through period', async () => {
    const cycles = getReturnCycles('2014-06-01', '2016-07-01', '2015-06-01', true);

    expect(cycles).to.equal([
      { startDate: '2014-06-01',
        endDate: '2014-10-31',
        isCurrent: false },
      { startDate: '2014-11-01',
        endDate: '2015-05-31',
        isCurrent: false },
      { startDate: '2015-06-01',
        endDate: '2015-10-31',
        isCurrent: true },
      { startDate: '2015-11-01',
        endDate: '2016-07-01',
        isCurrent: true } ]);
  });

  // ------------- getStatus
  lab.test('getStatus should return completed if received date set in NALD', async () => {
    expect(getStatus('2018-03-31')).to.equal('completed');
  });
  lab.test('getStatus should return due if no received date set in NALD', async () => {
    expect(getStatus(null)).to.equal('due');
  });
});

exports.lab = lab;
