'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const DateRange = require('../../../src/lib/models/date-range');
const ReturnLine = require('../../../src/lib/models/return-line');
const { TIME_PERIODS } = require('../../../src/lib/models/constants');

class TestModel { };

experiment('lib/models/return-line', () => {
  let line;

  beforeEach(async () => {
    line = new ReturnLine();
  });

  experiment('.id', () => {
    test('can be set to a GUID', async () => {
      const id = uuid();
      line.id = id;
      expect(line.id).to.equal(id);
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        line.id = null;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to a non-return ID string', async () => {
      const func = () => {
        line.id = 'not-a-guid';
      };
      expect(func).to.throw();
    });
  });

  experiment('.volume', () => {
    test('can be set to a positive number', async () => {
      line.volume = 4.465;
      expect(line.volume).to.equal(4.465);
    });

    test('can be set to null', async () => {
      line.volume = null;
      expect(line.volume).to.be.null();
    });

    test('throws an error if set to negative number', async () => {
      const func = () => {
        line.volume = -28.385;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        line.volume = 'a string';
      };
      expect(func).to.throw();
    });
  });

  experiment('.dateRange', () => {
    test('can be set to a DateRange instance', async () => {
      const dateRange = new DateRange('2019-09-01', null);
      line.dateRange = dateRange;
      expect(line.dateRange).to.equal(dateRange);
    });

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        line.dateRange = new TestModel();
      };
      expect(func).to.throw();
    });
  });

  experiment('.timePeriod', () => {
    for (const timePeriod in TIME_PERIODS) {
      test(`can be set to ${timePeriod}`, async () => {
        line.timePeriod = timePeriod;
        expect(line.timePeriod).to.equal(timePeriod);
      });
    }

    test('throws an error if set to null', async () => {
      const func = () => {
        line.timePeriod = null;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to an invalid time period', async () => {
      const func = () => {
        line.timePeriod = 'quarter-of-an-hour';
      };
      expect(func).to.throw();
    });
  });
});
