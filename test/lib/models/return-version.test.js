'use strict';

const moment = require('moment');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const ReturnVersion = require('../../../src/lib/models/return-version');
const ReturnLine = require('../../../src/lib/models/return-line');
const AbstractionPeriod = require('../../../src/lib/models/abstraction-period');
const DateRange = require('../../../src/lib/models/date-range');

class TestModel { };

const DATE_FORMAT = 'YYYY-MM-DD';

const createReturnLine = (year, month, volume) => {
  const startDate = moment({
    year,
    month: month - 1,
    day: 1
  });
  const endDate = moment(startDate).endOf('month');
  const returnLine = new ReturnLine();
  return returnLine.fromHash({
    timePeriod: 'month',
    dateRange: new DateRange(startDate.format(DATE_FORMAT), endDate.format(DATE_FORMAT)),
    volume
  });
};

experiment('lib/models/return-version', () => {
  let version;

  beforeEach(async () => {
    version = new ReturnVersion();
  });

  experiment('.id', () => {
    test('can be set to a GUID', async () => {
      const id = uuid();
      version.id = id;
      expect(version.id).to.equal(id);
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        version.id = null;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to a non-return ID string', async () => {
      const func = () => {
        version.id = 'not-a-guid';
      };
      expect(func).to.throw();
    });
  });

  experiment('.returnLines', () => {
    test('can be set to an array of purpose uses', async () => {
      const returnLines = [new ReturnLine()];
      version.returnLines = returnLines;
      expect(version.returnLines).to.equal(returnLines);
    });

    test('throws an error if not an array', async () => {
      const func = () => {
        const notAnArray = new ReturnLine();
        version.returnLines = notAnArray;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        const notReturnLines = [new TestModel()];
        version.returnLines = notReturnLines;
      };
      expect(func).to.throw();
    });
  });

  experiment('.isNilReturn', () => {
    test('can be set to a boolean true', async () => {
      version.isNilReturn = true;
      expect(version.isNilReturn).to.equal(true);
    });

    test('can be set to a boolean false', async () => {
      version.isNilReturn = false;
      expect(version.isNilReturn).to.equal(false);
    });

    test('throws an error if set to a different type', async () => {
      const func = () => {
        version.isNilReturn = 'not-a-boolean';
      };
      expect(func).to.throw();
    });
  });

  experiment('.isCurrentVersion', () => {
    test('can be set to a boolean true', async () => {
      version.isCurrentVersion = true;
      expect(version.isCurrentVersion).to.equal(true);
    });

    test('can be set to a boolean false', async () => {
      version.isCurrentVersion = false;
      expect(version.isCurrentVersion).to.equal(false);
    });

    test('throws an error if set to a different type', async () => {
      const func = () => {
        version.isCurrentVersion = 'not-a-boolean';
      };
      expect(func).to.throw();
    });
  });

  experiment('.getReturnLinesForBilling', () => {
    let absPeriod, chargePeriod;

    beforeEach(async () => {
      absPeriod = new AbstractionPeriod();
      absPeriod.fromHash({
        startDay: 1,
        startMonth: 4,
        endDay: 31,
        endMonth: 3
      });

      chargePeriod = new DateRange('2019-04-01', '2020-03-31');

      version.returnLines = [
        createReturnLine(2019, 4, 100),
        createReturnLine(2019, 5, 100),
        createReturnLine(2019, 6, null),
        createReturnLine(2019, 7, 100),
        createReturnLine(2019, 8, 0),
        createReturnLine(2019, 9, null),
        createReturnLine(2019, 10, 100),
        createReturnLine(2019, 11, 100),
        createReturnLine(2019, 12, 100),
        createReturnLine(2020, 1, 100),
        createReturnLine(2020, 2, 100),
        createReturnLine(2020, 3, 100)
      ];
    });

    const getLineStartDates = returnLines => returnLines.map(returnLine =>
      returnLine.dateRange.startDate
    );

    test('when the charge period and abs period are full year, zero and null lines are omitted', async () => {
      const lines = version.getReturnLinesForBilling(chargePeriod, absPeriod);
      const startDates = getLineStartDates(lines);
      expect(startDates).to.equal([
        '2019-04-01',
        '2019-05-01',
        '2019-07-01',
        '2019-10-01',
        '2019-11-01',
        '2019-12-01',
        '2020-01-01',
        '2020-02-01',
        '2020-03-01'
      ]);
    });

    test('when the charge period is not full year, return lines not overlapping the charge period are omitted', async () => {
      chargePeriod.endDate = '2020-01-15';
      const lines = version.getReturnLinesForBilling(chargePeriod, absPeriod);
      const startDates = getLineStartDates(lines);
      expect(startDates).to.equal([
        '2019-04-01',
        '2019-05-01',
        '2019-07-01',
        '2019-10-01',
        '2019-11-01',
        '2019-12-01',
        '2020-01-01'
      ]);
    });

    test('when the abs period is not full year, return lines not overlapping the abs period are omitted', async () => {
      absPeriod.fromHash({
        startDay: 1,
        startMonth: 1,
        endDay: 15,
        endMonth: 5
      });
      const lines = version.getReturnLinesForBilling(chargePeriod, absPeriod);
      const startDates = getLineStartDates(lines);
      expect(startDates).to.equal([
        '2019-04-01',
        '2019-05-01',
        '2020-01-01',
        '2020-02-01',
        '2020-03-01'
      ]);
    });
  });
});
