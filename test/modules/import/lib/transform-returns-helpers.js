const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const {
  convertNullStrings,
  mapFrequency,
  mapPeriod,
  getStartDate,
  mapUnit,
  mapUsability
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
});

exports.lab = lab;
