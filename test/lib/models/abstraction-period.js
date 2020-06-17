const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const AbstractionPeriod = require('../../../src/lib/models/abstraction-period');
const { CHARGE_SEASON } = require('../../../src/lib/models/constants');

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

  experiment('.setDates()', () => {
    test('sets the dates to the expected values', async () => {
      abstractionPeriod.setDates(1, 2, 3, 4);
      expect(abstractionPeriod.startDay).to.equal(1);
      expect(abstractionPeriod.startMonth).to.equal(2);
      expect(abstractionPeriod.endDay).to.equal(3);
      expect(abstractionPeriod.endMonth).to.equal(4);
    });
  });

  experiment('.isWithinAbstractionPeriod', () => {
    experiment('when the abstraction period is in the same year', () => {
      test('returns false if the start dates are the same', async () => {
        const summer = AbstractionPeriod.getSummer();

        const period = new AbstractionPeriod();
        period.setDates(1, 4, 1, 10);

        expect(period.isWithinAbstractionPeriod(summer)).to.equal(false);
      });

      test('returns false if the end dates are the same', async () => {
        const summer = AbstractionPeriod.getSummer();

        const period = new AbstractionPeriod();
        period.setDates(1, 5, 31, 10);

        expect(period.isWithinAbstractionPeriod(summer)).to.equal(false);
      });

      test('returns false if both start and end dates are the same', async () => {
        const summer = AbstractionPeriod.getSummer();
        const period = AbstractionPeriod.getSummer();

        expect(period.isWithinAbstractionPeriod(summer)).to.equal(false);
      });

      test('returns true if both dates are in between the period', async () => {
        const summer = AbstractionPeriod.getSummer();

        const period = new AbstractionPeriod();
        period.setDates(1, 5, 1, 6);

        expect(period.isWithinAbstractionPeriod(summer)).to.equal(true);
      });
    });

    experiment('when the abstraction period spans two years', () => {
      test('returns false if the start dates are the same', async () => {
        const winter = AbstractionPeriod.getWinter();

        const period = new AbstractionPeriod();
        period.setDates(1, 11, 1, 3);

        expect(period.isWithinAbstractionPeriod(winter)).to.equal(false);
      });

      test('returns false if the end dates are the same', async () => {
        const winter = AbstractionPeriod.getWinter();

        const period = new AbstractionPeriod();
        period.setDates(1, 2, 31, 3);

        expect(period.isWithinAbstractionPeriod(winter)).to.equal(false);
      });

      test('returns false if both start and end dates are the same', async () => {
        const winter = AbstractionPeriod.getWinter();
        const period = AbstractionPeriod.getWinter();

        expect(period.isWithinAbstractionPeriod(winter)).to.equal(false);
      });

      test('returns true if both dates are in between the period', async () => {
        const winter = AbstractionPeriod.getWinter();

        const period = new AbstractionPeriod();
        period.setDates(1, 12, 1, 3);

        expect(period.isWithinAbstractionPeriod(winter)).to.equal(true);
      });
    });
  });

  experiment('.getChargeSeason()', () => {
    experiment('when the period matches the summer period', () => {
      test('the season is all year', async () => {
        const period = new AbstractionPeriod();
        period.setDates(1, 4, 31, 10);

        expect(period.getChargeSeason()).to.equal(CHARGE_SEASON.allYear);
      });
    });

    experiment('when the period matches the winter period', () => {
      test('the season is all year', async () => {
        const winter = AbstractionPeriod.getWinter();
        expect(winter.getChargeSeason()).to.equal(CHARGE_SEASON.allYear);
      });
    });

    experiment('when the period is within the summer period', () => {
      test('the season is summer', async () => {
        const april = new AbstractionPeriod();
        april.setDates(2, 4, 30, 4);
        expect(april.getChargeSeason()).to.equal(CHARGE_SEASON.summer);

        const october = new AbstractionPeriod();
        october.setDates(2, 10, 25, 10);
        expect(october.getChargeSeason()).to.equal(CHARGE_SEASON.summer);
      });
    });

    experiment('when the period is within the winter period', () => {
      test('the season is winter', async () => {
        const november = new AbstractionPeriod();
        november.setDates(2, 11, 30, 11);
        expect(november.getChargeSeason()).to.equal(CHARGE_SEASON.winter);

        const march = new AbstractionPeriod();
        march.setDates(2, 3, 25, 3);
        expect(march.getChargeSeason()).to.equal(CHARGE_SEASON.winter);

        const xmasHols = new AbstractionPeriod();
        xmasHols.setDates(20, 12, 4, 1);

        expect(xmasHols.getChargeSeason()).to.equal(CHARGE_SEASON.winter);
      });
    });
  });
});
