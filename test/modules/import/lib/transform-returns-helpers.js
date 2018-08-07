const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const {
  convertNullStrings,
  mapFrequency,
  mapPeriod,
  getStartDate,
  mapUnit,
  mapUsability,
  getFinancialYear,
  getSummerYear,
  isNilReturn,
  mapReceivedDate
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

  lab.test('Test getFinancialYear', async () => {
    expect(getFinancialYear('01/01/2015')).to.equal({
      startDate: '2014-04-01',
      endDate: '2015-03-31'
    });
    expect(getFinancialYear('31/03/2016')).to.equal({
      startDate: '2015-04-01',
      endDate: '2016-03-31'
    });
    expect(getFinancialYear('01/04/2016')).to.equal({
      startDate: '2016-04-01',
      endDate: '2017-03-31'
    });
    expect(getFinancialYear('31/12/2016')).to.equal({
      startDate: '2016-04-01',
      endDate: '2017-03-31'
    });
  });

  lab.test('Test getSummerYear', async () => {
    expect(getSummerYear('01/01/2015')).to.equal({
      startDate: '2014-11-01',
      endDate: '2015-10-31'
    });
    expect(getSummerYear('31/10/2016')).to.equal({
      startDate: '2015-11-01',
      endDate: '2016-10-31'
    });
    expect(getSummerYear('01/11/2016')).to.equal({
      startDate: '2016-11-01',
      endDate: '2017-10-31'
    });
    expect(getSummerYear('31/12/2016')).to.equal({
      startDate: '2016-11-01',
      endDate: '2017-10-31'
    });
  });

  lab.test('Test isNilReturn', async () => {
    expect(isNilReturn([0, 0, null])).to.equal(true);
    expect(isNilReturn([])).to.equal(true);
    expect(isNilReturn([0, null, 0.1])).to.equal(false);
  });

  lab.test('Test mapReceivedDate with no logs', async () => {
    const logs = [];

    expect(mapReceivedDate(logs)).to.equal(null);
  });

  lab.test('Test mapReceivedDate with a null string value', async () => {
    const logs = [{ RECD_DATE: '01/01/2017'}, { RECD_DATE: 'null'}];

    expect(mapReceivedDate(logs)).to.equal(null);
  });

  lab.test('Test mapReceivedDate with valiid dates', async () => {
    const logs = [{ RECD_DATE: '25/12/2017'}, { RECD_DATE: '04/01/2017'}];

    expect(mapReceivedDate(logs)).to.equal('2017-12-25');
  });
});

exports.lab = lab;
