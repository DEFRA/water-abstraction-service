const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');
const moment = require('moment');

const {
  convertNullStrings,
  mapFrequency,
  mapPeriod,
  getStartDate,
  mapUnit,
  mapUsability,
  getCyclePeriods
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

  lab.test('Test mapping of NALD frequency codes', async () => {
    expect(mapFrequency('D')).to.equal('daily');
    expect(mapFrequency('W')).to.equal('weekly');
    expect(mapFrequency('M')).to.equal('monthly');
    expect(mapFrequency('A')).to.equal('annual');
    expect(mapFrequency('x')).to.equal(undefined);
  });

  lab.test('Test mapping of NALD returns periods codes', async () => {
    expect(mapPeriod('D')).to.equal('day');
    expect(mapPeriod('W')).to.equal('week');
    expect(mapPeriod('M')).to.equal('month');
    expect(mapPeriod('A')).to.equal('year');
    expect(mapPeriod('x')).to.equal(undefined);
  });

  lab.test('Test finding start of return period for given date and period', async () => {
    // Daily
    expect(getStartDate('20170824', '20170824', 'D')).to.equal('2017-08-24');

    // Monthly
    expect(getStartDate('20150201', '20150225', 'M')).to.equal('2015-02-01');

    // Weekly
    expect(getStartDate('20180101', '20180801', 'W')).to.equal('2018-07-30');

    // Annual
    expect(getStartDate('20180901', '20181025', 'A')).to.equal('2018-09-01');
  });

  lab.test('Test mapping NALD units', async () => {
    // Metric
    expect(mapUnit('M')).to.equal('m³');

    // Imperial
    expect(mapUnit('I')).to.equal('gal');

    // Unkwnown unit - leave as is
    expect(mapUnit('x')).to.equal('x');
  });

  lab.test('Test mapping NALD usability', async () => {
    expect(mapUsability('E')).to.equal('estimate');
    expect(mapUsability('M')).to.equal('measured');
    expect(mapUsability('D')).to.equal('derived');
    expect(mapUsability('A')).to.equal('assessed');
    expect(mapUsability('x')).to.equal(undefined);
  });

  lab.test('Test billing cycle periods - all year', async () => {
    const periods = getCyclePeriods(moment('2014-01-01', 'YYYY-MM-DD'), moment('2016-06-15', 'YYYY-MM-DD'), false);

    expect(periods).to.equal([
      {
        startDate: '2014-01-01',
        endDate: '2014-03-31'
      },
      {
        startDate: '2014-04-01',
        endDate: '2015-03-31'
      },
      {
        startDate: '2015-04-01',
        endDate: '2016-03-31'
      },
      {
        startDate: '2016-04-01',
        endDate: '2016-06-15'
      }
    ]);
  });

  lab.test('Test billing cycle periods - all year with start/end dates matching cycle dates', async () => {
    const periods = getCyclePeriods(moment('2014-04-01', 'YYYY-MM-DD'), moment('2016-03-31', 'YYYY-MM-DD'), false);

    expect(periods).to.equal([
      {
        startDate: '2014-04-01',
        endDate: '2015-03-31'
      },
      {
        startDate: '2015-04-01',
        endDate: '2016-03-31'
      }
    ]);
  });

  lab.test('Test billing cycle periods - summer', async () => {
    const periods = getCyclePeriods(moment('2014-11-05', 'YYYY-MM-DD'), moment('2016-05-15', 'YYYY-MM-DD'), true);

    expect(periods).to.equal([
      {
        startDate: '2014-11-05',
        endDate: '2015-10-31'
      },
      {
        startDate: '2015-11-01',
        endDate: '2016-05-15'
      }
    ]);
  });
});

exports.lab = lab;
