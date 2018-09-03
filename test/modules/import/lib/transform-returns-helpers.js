const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const {
  convertNullStrings,
  mapPeriod,
  getStartDate,
  mapUnit,
  mapUsability,
  getFinancialYear,
  getSummerYear,
  mapReceivedDate,
  getCurrentCycles
} = require('../../../../src/modules/import/lib/transform-returns-helpers');

const testCycles = [{
  startDate: '2014-11-01',
  endDate: '2015-10-31'
}, {
  startDate: '2015-11-01',
  endDate: '2016-10-31'
}, {
  startDate: '2016-11-01',
  endDate: '2017-10-31'
}];

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

  lab.test('Test splitting returns cycles when licence start date is null', async () => {
    const split = getCurrentCycles(testCycles, null);
    expect(split).to.equal(testCycles.map(row => ({...row, isCurrent: false })));
  });

  lab.test('Test splitting returns cycles when licence start date is before first cycle', async () => {
    const split = getCurrentCycles(testCycles, '2011-01-01');
    expect(split).to.equal(testCycles.map(row => ({...row, isCurrent: true })));
  });

  lab.test('Test splitting returns cycles when licence start date is within a cycle', async () => {
    const split = getCurrentCycles(testCycles, '2016-02-05');
    expect(split).to.equal([{
      startDate: '2014-11-01',
      endDate: '2015-10-31',
      isCurrent: false
    }, {
      startDate: '2015-11-01',
      endDate: '2016-02-04',
      isCurrent: false
    },
    {
      startDate: '2016-02-05',
      endDate: '2016-10-31',
      isCurrent: true
    }, {
      startDate: '2016-11-01',
      endDate: '2017-10-31',
      isCurrent: true
    }]);
  });

  lab.test('Test splitting returns cycles when licence start date is after last cycle', async () => {
    const split = getCurrentCycles(testCycles, '2018-02-05');
    expect(split).to.equal(testCycles.map(row => ({...row, isCurrent: false })));
  });
});

exports.lab = lab;
