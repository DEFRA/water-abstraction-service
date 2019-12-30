const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const AbstractionPeriod = require('../../../src/lib/models/abstraction-period');

experiment('lib/models/abstraction-period', () => {
  let abstractionPeriod;

  beforeEach(async () => {
    abstractionPeriod = new AbstractionPeriod();
  });

  experiment('.startDay', () => {
    test('can be set to a number between 1-31', async () => {
      abstractionPeriod.startDay = 5;
      expect(abstractionPeriod.startDay).to.equal(5);
    });

    test('throws an error if set <1', async () => {
      const func = () => {
        abstractionPeriod.startDay = 0;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to a non-integer', async () => {
      const func = () => {
        abstractionPeriod.startDay = 12.5;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to a non-number', async () => {
      const func = () => {
        abstractionPeriod.startDay = 'not-a-number';
      };
      expect(func).to.throw();
    });

    test('throws an error if set >31', async () => {
      const func = () => {
        abstractionPeriod.startDay = 32;
      };
      expect(func).to.throw();
    });
  });

  experiment('.startMonth', () => {
    test('can be set to a number between 1-12', async () => {
      abstractionPeriod.startMonth = 5;
      expect(abstractionPeriod.startMonth).to.equal(5);
    });

    test('throws an error if set <1', async () => {
      const func = () => {
        abstractionPeriod.startMonth = 0;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to a non-integer', async () => {
      const func = () => {
        abstractionPeriod.startMonth = 5.5;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to a non-number', async () => {
      const func = () => {
        abstractionPeriod.startMonth = 'not-a-number';
      };
      expect(func).to.throw();
    });

    test('throws an error if set >12', async () => {
      const func = () => {
        abstractionPeriod.startMonth = 13;
      };
      expect(func).to.throw();
    });
  });

  experiment('.endDay', () => {
    test('can be set to a number between 1-31', async () => {
      abstractionPeriod.endDay = 5;
      expect(abstractionPeriod.endDay).to.equal(5);
    });

    test('throws an error if set <1', async () => {
      const func = () => {
        abstractionPeriod.endDay = 0;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to a non-integer', async () => {
      const func = () => {
        abstractionPeriod.endDay = 12.5;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to a non-number', async () => {
      const func = () => {
        abstractionPeriod.endDay = 'not-a-number';
      };
      expect(func).to.throw();
    });

    test('throws an error if set >31', async () => {
      const func = () => {
        abstractionPeriod.endDay = 32;
      };
      expect(func).to.throw();
    });
  });

  experiment('.endMonth', () => {
    test('can be set to a number between 1-12', async () => {
      abstractionPeriod.endMonth = 5;
      expect(abstractionPeriod.endMonth).to.equal(5);
    });

    test('throws an error if set <1', async () => {
      const func = () => {
        abstractionPeriod.endMonth = 0;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to a non-integer', async () => {
      const func = () => {
        abstractionPeriod.endMonth = 5.5;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to a non-number', async () => {
      const func = () => {
        abstractionPeriod.endMonth = 'not-a-number';
      };
      expect(func).to.throw();
    });

    test('throws an error if set >12', async () => {
      const func = () => {
        abstractionPeriod.endMonth = 13;
      };
      expect(func).to.throw();
    });
  });
});
