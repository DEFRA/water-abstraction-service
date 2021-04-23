'use strict';

const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const mappers = require('../../../../src/modules/kpi-reporting/lib/mappers');
const { expect } = require('@hapi/code');

experiment('./modules/kpi-reporting/lib/mappers', () => {
  experiment('.mapLicenceNamesData', () => {
    const licenceNamesData = [
      { currentYear: true, month: 1, named: 220, renamed: 110, year: 2020 },
      { currentYear: false, month: 12, named: 200, renamed: 100, year: 2019 }
    ];
    test('the licences named data is mapped correctly', async () => {
      const mappedData = mappers.mapLicenceNamesData(licenceNamesData, new Date('2020-12-01'));
      expect(mappedData.totals).to.be.equal({ allTime: 630, ytd: 330 });
      expect(mappedData.monthly[0].currentYear).to.be.true();
      expect(mappedData.monthly[0].named).to.equal(220);
      expect(mappedData.monthly[0].renamed).to.equal(110);
      expect(mappedData.monthly[0].year).to.equal(2020);
      expect(mappedData.monthly[0].namedChange).to.equal(10);
      expect(mappedData.monthly[0].renamedChange).to.equal(10);
    });
  });

  experiment('.mapReturnsDataByCycle', () => {
    const returnsSummerCycle = { due: 1551, internalOnTime: 1, internalLate: 1, externalOnTime: 1, externalLate: 1 };
    const returnCycle = { startDate: '2017-11-01', endDate: '2018-10-31', isSummer: true };

    test('the returns data by cycle is mapped correctly', async () => {
      const mappedData = mappers.mapReturnsDataByCycle(returnsSummerCycle, returnCycle);
      expect(mappedData.startDate).to.be.equal('2017-11-01');
      expect(mappedData.endDate).to.equal('2018-10-31');
      expect(mappedData.isSummer).to.be.true();
      expect(mappedData.due).to.equal(1551);
      expect(mappedData.internalOnTime).to.equal(1);
      expect(mappedData.internalLate).to.equal(1);
      expect(mappedData.externalOnTime).to.equal(1);
      expect(mappedData.externalLate).to.equal(1);
      expect(mappedData.total).to.equal(4);
    });
  });

  experiment('.mapReturnsDataMonthly', () => {
    const returnsDataMonthly = [
      { currentYear: true, month: 2, paperFormCount: 2, returnCount: 2, year: 2020 },
      { currentYear: true, month: 1, paperFormCount: 3, returnCount: 3, year: 2020 },
      { currentYear: false, month: 12, paperFormCount: 1, returnCount: 1, year: 2020 }
    ];

    test('the returns data by cycle is mapped correctly', async () => {
      const mappedData = mappers.mapReturnsDataMonthly(returnsDataMonthly, new Date('2020-12-01'));
      expect(mappedData.totals).to.be.equal({ allTime: 6, ytd: 5 });
      expect(mappedData.monthly.length).to.equal(2);
      expect(mappedData.monthly[0].month).to.equal('February');
      expect(mappedData.monthly[0].paperFormCount).to.equal(2);
      expect(mappedData.monthly[0].returnCount).to.equal(2);
      expect(mappedData.monthly[0].currentYear).to.equal(2020);
      expect(mappedData.monthly[1].month).to.equal('January');
      expect(mappedData.monthly[1].paperFormCount).to.equal(3);
      expect(mappedData.monthly[1].returnCount).to.equal(3);
      expect(mappedData.monthly[1].currentYear).to.equal(2020);
    });
  });
});
