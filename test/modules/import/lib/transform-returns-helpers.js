const Lab = require('lab');
const { beforeEach, experiment, test } = exports.lab = Lab.script();
const { expect } = require('code');

const {
  convertNullStrings,
  mapPeriod,
  mapReceivedDate,
  getReturnCycles,
  getPeriodStart,
  addDate,
  getStatus,
  getFormatStartDate,
  getFormatEndDate,
  getFormatCycles,
  formatReturnMetadata,
  getDueDate
} = require('../../../../src/modules/import/lib/transform-returns-helpers');

experiment('Test returns data transformation helpers', () => {
  test('Test convert null strings on shallow object', async () => {
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

  test('Test mapping of NALD returns periods codes', async () => {
    expect(mapPeriod('D')).to.equal('day');
    expect(mapPeriod('W')).to.equal('week');
    expect(mapPeriod('M')).to.equal('month');
    expect(mapPeriod('Q')).to.equal('quarter');
    expect(mapPeriod('A')).to.equal('year');
    expect(mapPeriod('x')).to.equal(undefined);
  });

  test('Test mapReceivedDate with no logs', async () => {
    const logs = [];

    expect(mapReceivedDate(logs)).to.equal(null);
  });

  test('Test mapReceivedDate with a null string value', async () => {
    const logs = [{ RECD_DATE: '01/01/2017' }, { RECD_DATE: 'null' }];

    expect(mapReceivedDate(logs)).to.equal(null);
  });

  test('Test mapReceivedDate with valid dates', async () => {
    const logs = [{ RECD_DATE: '25/12/2017' }, { RECD_DATE: '04/01/2017' }];

    expect(mapReceivedDate(logs)).to.equal('2017-12-25');
  });

  // ---------- getNextPeriodStart - financial
  test('getNextPeriodStart for financial year return in same year', async () => {
    expect(getPeriodStart('2018-05-01')).to.equal('2018-04-01');
  });
  test('getNextPeriodStart for financial year return in different year', async () => {
    expect(getPeriodStart('2018-02-01')).to.equal('2017-04-01');
  });
  test('getNextPeriodStart for financial year return on period start date', async () => {
    expect(getPeriodStart('2018-04-01')).to.equal('2018-04-01');
  });
  test('getNextPeriodStart for financial year return on period end date', async () => {
    expect(getPeriodStart('2018-03-31')).to.equal('2017-04-01');
  });

  // ---------- getNextPeriodStart - summer
  test('getNextPeriodStart for summer year return in same year', async () => {
    expect(getPeriodStart('2018-12-01', true)).to.equal('2018-11-01');
  });
  test('getNextPeriodStart for summer year return in different year', async () => {
    expect(getPeriodStart('2018-02-01', true)).to.equal('2017-11-01');
  });
  test('getNextPeriodStart for summer year return on period start date', async () => {
    expect(getPeriodStart('2018-11-01', true)).to.equal('2018-11-01');
  });
  test('getNextPeriodStart for summer year return on period end date', async () => {
    expect(getPeriodStart('2018-10-31', true)).to.equal('2017-11-01');
  });

  // ---------- addDate
  test('addDate - add a date if within range', async () => {
    expect(addDate([], '2018-12-01', '2018-01-01', '2018-12-31')).to.equal(['2018-12-01']);
  });
  test('addDate - dont add a date if before start date', async () => {
    expect(addDate([], '2017-12-01', '2018-01-01', '2018-12-31')).to.equal([]);
  });
  test('addDate - dont add a date if after end date', async () => {
    expect(addDate([], '2018-12-05', '2018-01-01', '2018-11-31')).to.equal([]);
  });
  test('addDate - dont add a date if on start date', async () => {
    expect(addDate([], '2017-12-01', '2017-12-01', '2018-12-31')).to.equal([]);
  });
  test('addDate - dont add a date if on end date', async () => {
    expect(addDate([], '2018-11-31', '2018-01-01', '2018-11-31')).to.equal([]);
  });
  test('addDate - dont add duplicate dates', async () => {
    let dates = [];
    dates = addDate(dates, '2018-12-01', '2018-01-01', '2018-12-31');
    dates = addDate(dates, '2018-12-01', '2018-01-01', '2018-12-31');
    expect(dates).to.equal(['2018-12-01']);
  });

  // ---------- getReturnCycles - financial year
  test('getReturnCycles - single financial year, current version', async () => {
    const cycles = getReturnCycles('2014-04-01', '2015-03-31', '2014-04-01', false);
    expect(cycles).to.equal([{
      startDate: '2014-04-01',
      endDate: '2015-03-31',
      isCurrent: true
    }]);
  });
  test('getReturnCycles - single financial year, expired version', async () => {
    const cycles = getReturnCycles('2014-04-01', '2015-03-31', '2016-04-01', false);
    expect(cycles).to.equal([{
      startDate: '2014-04-01',
      endDate: '2015-03-31',
      isCurrent: false
    }]);
  });
  test('getReturnCycles - part financial years, current version', async () => {
    const cycles = getReturnCycles('2014-06-01', '2015-07-01', '2010-04-01', false);
    expect(cycles).to.equal([
      { startDate: '2014-06-01',
        endDate: '2015-03-31',
        isCurrent: true },
      { startDate: '2015-04-01',
        endDate: '2015-07-01',
        isCurrent: true } ]);
  });

  test('getReturnCycles - part financial years, expired version', async () => {
    const cycles = getReturnCycles('2014-06-01', '2015-07-01', '2018-04-01', false);
    expect(cycles).to.equal([
      { startDate: '2014-06-01',
        endDate: '2015-03-31',
        isCurrent: false },
      { startDate: '2015-04-01',
        endDate: '2015-07-01',
        isCurrent: false } ]);
  });

  test('getReturnCycles - part financial years, expiry on period start', async () => {
    const cycles = getReturnCycles('2014-06-01', '2015-07-01', '2015-04-01', false);
    expect(cycles).to.equal([
      { startDate: '2014-06-01',
        endDate: '2015-03-31',
        isCurrent: false },
      { startDate: '2015-04-01',
        endDate: '2015-07-01',
        isCurrent: true } ]);
  });

  test('getReturnCycles - part financial years, expiry part-way through period', async () => {
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
  test('getReturnCycles - single summer year, current version', async () => {
    const cycles = getReturnCycles('2014-11-01', '2015-10-31', '2014-11-01', true);
    expect(cycles).to.equal([{
      startDate: '2014-11-01',
      endDate: '2015-10-31',
      isCurrent: true
    }]);
  });
  test('getReturnCycles - single summer year, expired version', async () => {
    const cycles = getReturnCycles('2014-11-01', '2015-10-31', '2016-04-01', true);
    expect(cycles).to.equal([{
      startDate: '2014-11-01',
      endDate: '2015-10-31',
      isCurrent: false
    }]);
  });
  test('getReturnCycles - part summer years, current version', async () => {
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

  test('getReturnCycles - part summer years, expired version', async () => {
    const cycles = getReturnCycles('2014-06-01', '2015-07-01', '2018-04-01', true);

    expect(cycles).to.equal([
      { startDate: '2014-06-01',
        endDate: '2014-10-31',
        isCurrent: false },
      { startDate: '2014-11-01',
        endDate: '2015-07-01',
        isCurrent: false } ]);
  });

  test('getReturnCycles - part summer years, expiry on period start', async () => {
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

  test('getReturnCycles - part summer years, expiry part-way through period', async () => {
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
  test('getStatus should return completed if received date set in NALD', async () => {
    expect(getStatus('2018-03-31')).to.equal('completed');
  });
  test('getStatus should return due if no received date set in NALD', async () => {
    expect(getStatus(null)).to.equal('due');
  });
});

experiment('Test getFormatStartDate', () => {
  test('It should return version start date when time limited date is null', async () => {
    const format = {
      EFF_ST_DATE: '03/05/2017',
      TIMELTD_ST_DATE: 'null'
    };
    expect(getFormatStartDate(format)).to.equal('2017-05-03');
  });

  test('It should return version start date if after time limited start date', async () => {
    const format = {
      EFF_ST_DATE: '03/05/2017',
      TIMELTD_ST_DATE: '01/05/2016'
    };
    expect(getFormatStartDate(format)).to.equal('2017-05-03');
  });

  test('It should return time limited start date if after version start date', async () => {
    const format = {
      EFF_ST_DATE: '03/05/2017',
      TIMELTD_ST_DATE: '04/12/2017'
    };
    expect(getFormatStartDate(format)).to.equal('2017-12-04');
  });
});

experiment('Test getFormatEndDate', () => {
  test('It should return null when both dates are null', async () => {
    const format = {
      EFF_END_DATE: 'null',
      TIMELTD_END_DATE: 'null'
    };
    expect(getFormatEndDate(format)).to.equal(null);
  });

  test('It should return effective end date if time limited date is null', async () => {
    const format = {
      EFF_END_DATE: '22/02/2014',
      TIMELTD_END_DATE: 'null'
    };
    expect(getFormatEndDate(format)).to.equal('2014-02-22');
  });

  test('It should return effective end date if time limited date is after effective end date', async () => {
    const format = {
      EFF_END_DATE: '22/02/2014',
      TIMELTD_END_DATE: '23/02/2014'
    };
    expect(getFormatEndDate(format)).to.equal('2014-02-22');
  });

  test('It should return time limited end date if effective end date is null', async () => {
    const format = {
      EFF_END_DATE: 'null',
      TIMELTD_END_DATE: '23/02/2014'
    };
    expect(getFormatEndDate(format)).to.equal('2014-02-23');
  });
  test('It should return time limited end date if before effective end date', async () => {
    const format = {
      EFF_END_DATE: '25/04/2015',
      TIMELTD_END_DATE: '23/02/2014'
    };
    expect(getFormatEndDate(format)).to.equal('2014-02-23');
  });
});

experiment('Test getFormatCycles', () => {
  test('It should calculate summer cycle', async () => {
    const format = {
      FORM_PRODN_MONTH: '80',
      EFF_ST_DATE: '23/05/2016',
      TIMELTD_ST_DATE: 'null',
      EFF_END_DATE: '30/03/2018',
      TIMELTD_END_DATE: 'null'
    };
    const cycles = getFormatCycles(format, '2014-04-01');

    expect(cycles).to.equal([ { startDate: '2016-05-23',
      endDate: '2016-10-31',
      isCurrent: true },
    { startDate: '2016-11-01',
      endDate: '2017-10-31',
      isCurrent: true },
    { startDate: '2017-11-01',
      endDate: '2018-03-30',
      isCurrent: true } ]);
  });

  test('It should calculate winter cycle', async () => {
    const format = {
      FORM_PRODN_MONTH: '66',
      EFF_ST_DATE: '23/05/2016',
      TIMELTD_ST_DATE: 'null',
      EFF_END_DATE: '30/03/2018',
      TIMELTD_END_DATE: 'null'
    };
    const cycles = getFormatCycles(format, '2014-04-01');

    expect(cycles).to.equal([ { startDate: '2016-05-23',
      endDate: '2017-03-31',
      isCurrent: true },
    { startDate: '2017-04-01',
      endDate: '2018-03-30',
      isCurrent: true } ]);
  });

  test('It should split cycles on current licence version start date', async () => {
    const format = {
      FORM_PRODN_MONTH: '66',
      EFF_ST_DATE: '23/05/2016',
      TIMELTD_ST_DATE: 'null',
      EFF_END_DATE: '30/03/2018',
      TIMELTD_END_DATE: 'null'
    };
    const cycles = getFormatCycles(format, '2017-06-01');

    expect(cycles).to.equal([ { startDate: '2016-05-23',
      endDate: '2017-03-31',
      isCurrent: false },
    { startDate: '2017-04-01',
      endDate: '2017-05-31',
      isCurrent: false },
    { startDate: '2017-06-01',
      endDate: '2018-03-30',
      isCurrent: true } ]);
  });

  test('It should observe time limited start/end dates for summer cycle', async () => {
    const format = {
      FORM_PRODN_MONTH: '80',
      EFF_ST_DATE: '23/05/2016',
      TIMELTD_ST_DATE: '25/05/2016',
      EFF_END_DATE: '30/03/2018',
      TIMELTD_END_DATE: '28/03/2018'
    };
    const cycles = getFormatCycles(format, '2014-04-01');

    expect(cycles).to.equal([ { startDate: '2016-05-25',
      endDate: '2016-10-31',
      isCurrent: true },
    { startDate: '2016-11-01',
      endDate: '2017-10-31',
      isCurrent: true },
    { startDate: '2017-11-01',
      endDate: '2018-03-28',
      isCurrent: true } ]);
  });
});

experiment('formatReturnMetadata', () => {
  let metadata;

  beforeEach(async () => {
    metadata = formatReturnMetadata({
      purposes: [
        {
          APUR_APPR_CODE: 'W',
          APUR_APSE_CODE: 'WAT',
          APUR_APUS_CODE: '180',
          PURP_ALIAS: 'Water alias',
          primary_purpose: 'primary',
          secondary_purpose: 'secondary',
          tertiary_purpose: 'tertiary'
        },
        {
          APUR_APPR_CODE: 'A',
          APUR_APSE_CODE: 'AGR',
          APUR_APUS_CODE: '400',
          PURP_ALIAS: 'Agri alias',
          primary_purpose: 'primary',
          secondary_purpose: 'secondary',
          tertiary_purpose: 'tertiary'
        }
      ],
      points: []
    });
  });

  test('the purposes contain the alias', async () => {
    expect(metadata.purposes[0].alias).to.equal('Water alias');
    expect(metadata.purposes[1].alias).to.equal('Agri alias');
  });
});

experiment('getDueDate', () => {
  test('returns a date 28 days later', async () => {
    expect(getDueDate('2018-01-01')).to.equal('2018-01-29');
    expect(getDueDate('2018-12-10')).to.equal('2019-01-07');
  });
});
