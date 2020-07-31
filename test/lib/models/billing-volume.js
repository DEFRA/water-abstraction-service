'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const BillingVolume = require('../../../src/lib/models/billing-volume');
const FinancialYear = require('../../../src/lib/models/financial-year');
const User = require('../../../src/lib/models/user');

class TestModel { };

const { twoPartTariffStatuses } = BillingVolume;

experiment('lib/models/billingVolume', () => {
  let billingVolume;

  beforeEach(async () => {
    billingVolume = new BillingVolume();
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      const id = uuid();
      billingVolume.id = id;
      expect(billingVolume.id).to.equal(id);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        billingVolume.id = '1234';
      };
      expect(func).to.throw();
    });
  });

  experiment('.chargeElementId', () => {
    const chargeElementId = uuid();

    test('can be set to a guid string', async () => {
      billingVolume.chargeElementId = chargeElementId;
      expect(billingVolume.chargeElementId).to.equal(chargeElementId);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        billingVolume.chargeElementId = '1234';
      };
      expect(func).to.throw();
    });
  });

  experiment('.financialYear', () => {
    test('can be set to a FinancialYear instance', async () => {
      const financialYear = new FinancialYear(2019);
      billingVolume.financialYear = financialYear;
      expect(billingVolume.financialYear.endYear).to.equal(2019);
    });

    test('cannot be set to a different model', async () => {
      const func = () => {
        billingVolume.financialYear = new TestModel();
      };
      expect(func).to.throw();
    });
  });

  experiment('.isSummer', () => {
    test('can be set to a boolean', async () => {
      billingVolume.isSummer = true;
      expect(billingVolume.isSummer).to.equal(true);
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        billingVolume.twoPartTariffError = null;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to undefined', async () => {
      const func = () => {
        billingVolume.twoPartTariffError = undefined;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        billingVolume.twoPartTariffError = 'not-a-boolean';
      };
      expect(func).to.throw();
    });
  });

  experiment('.calculatedVolume', () => {
    test('can be set to a positive number', async () => {
      billingVolume.calculatedVolume = 4.465;
      expect(billingVolume.calculatedVolume).to.equal(4.465);
    });

    test('can be set to null', async () => {
      billingVolume.calculatedVolume = null;
      expect(billingVolume.calculatedVolume).to.be.null();
    });

    test('throws an error if set to negative number', async () => {
      const func = () => {
        billingVolume.calculatedVolume = -28.385;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        billingVolume.calculatedVolume = 'a string';
      };
      expect(func).to.throw();
    });
  });

  experiment('.twoPartTariffError', () => {
    test('can be set to a boolean', async () => {
      billingVolume.twoPartTariffError = true;
      expect(billingVolume.twoPartTariffError).to.equal(true);
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        billingVolume.twoPartTariffError = null;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to undefined', async () => {
      const func = () => {
        billingVolume.twoPartTariffError = undefined;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        billingVolume.twoPartTariffError = 'not-a-boolean';
      };
      expect(func).to.throw();
    });
  });

  experiment('.twoPartTariffStatus', () => {
    for (const status of [10, 20, 30, 40, 50, 60, 70]) {
      test(`can set the twoPartTariffStatus to "${status}"`, async () => {
        billingVolume.twoPartTariffStatus = status;
        expect(billingVolume.twoPartTariffStatus).to.equal(status);
      });
    }

    test('can be set to null', async () => {
      billingVolume.twoPartTariffStatus = null;
      expect(billingVolume.twoPartTariffStatus).to.be.null();
    });

    test('setting twoPartTariffStatus to invalid value throws an error', async () => {
      const func = () => {
        billingVolume.twoPartTariffStatus = 600;
      };
      expect(func).throw();
    });
  });

  experiment('.twoPartTariffReview', () => {
    const twoPartTariffReview = new User();

    test('can be set to a User instance', async () => {
      billingVolume.twoPartTariffReview = twoPartTariffReview;
      expect(billingVolume.twoPartTariffReview).to.equal(twoPartTariffReview);
    });

    test('can be set to null', async () => {
      billingVolume.twoPartTariffReview = null;
      expect(billingVolume.twoPartTariffReview).to.be.null();
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        billingVolume.twoPartTariffReview = new TestModel();
      };
      expect(func).to.throw();
    });
  });

  experiment('.isApproved', () => {
    test('can be set to a boolean', async () => {
      billingVolume.isApproved = true;
      expect(billingVolume.isApproved).to.equal(true);
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        billingVolume.isApproved = null;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to undefined', async () => {
      const func = () => {
        billingVolume.isApproved = undefined;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        billingVolume.isApproved = 'not-a-boolean';
      };
      expect(func).to.throw();
    });
  });

  experiment('.volume', () => {
    test('can be set to a positive number', async () => {
      billingVolume.volume = 4.465;
      expect(billingVolume.volume).to.equal(4.465);
    });

    test('can be set to null', async () => {
      billingVolume.volume = null;
      expect(billingVolume.volume).to.be.null();
    });

    test('throws an error if set to negative number', async () => {
      const func = () => {
        billingVolume.volume = -28.385;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        billingVolume.volume = 'a string';
      };
      expect(func).to.throw();
    });
  });

  experiment('.toJSON', () => {
    test('returns the expected object', async () => {
      const billingVolume = new BillingVolume();
      billingVolume.id = uuid();
      billingVolume.chargeElementId = uuid();
      billingVolume.calculatedVolume = 25;

      expect(billingVolume.toJSON()).to.equal({
        id: billingVolume.id,
        chargeElementId: billingVolume.chargeElementId,
        calculatedVolume: billingVolume.calculatedVolume
      });
    });
  });

  experiment('.setTwoPartTariffStatus', () => {
    experiment('when no returns are submitted', () => {
      beforeEach(async () => {
        billingVolume.setTwoPartTariffStatus(twoPartTariffStatuses.ERROR_NO_RETURNS_SUBMITTED, 20);
      });

      test('the volume is set', async () => {
        expect(billingVolume.volume).to.be.equal(20);
      });

      test('the calculatedVolume is undefined', async () => {
        expect(billingVolume.calculatedVolume).to.be.undefined();
      });

      test('the error flag is not set', async () => {
        expect(billingVolume.twoPartTariffError).to.not.be.true();
      });

      test('the status code is set', async () => {
        expect(billingVolume.twoPartTariffStatus).to.equal(twoPartTariffStatuses.ERROR_NO_RETURNS_SUBMITTED);
      });
    });

    experiment('when returns are under query', () => {
      beforeEach(async () => {
        billingVolume.setTwoPartTariffStatus(twoPartTariffStatuses.ERROR_UNDER_QUERY, 20);
      });

      test('the volume and calculated volume are not set', async () => {
        expect(billingVolume.volume).to.be.undefined();
        expect(billingVolume.calculatedVolume).to.be.undefined();
      });

      test('the error flag is set', async () => {
        expect(billingVolume.twoPartTariffError).to.be.true();
      });

      test('the status code is set', async () => {
        expect(billingVolume.twoPartTariffStatus).to.equal(twoPartTariffStatuses.ERROR_UNDER_QUERY);
      });
    });

    experiment('when returns are received not keyed', () => {
      beforeEach(async () => {
        billingVolume.setTwoPartTariffStatus(twoPartTariffStatuses.ERROR_RECEIVED, 20);
      });

      test('the volume and calculated volume are not set', async () => {
        expect(billingVolume.volume).to.be.undefined();
        expect(billingVolume.calculatedVolume).to.be.undefined();
      });

      test('the error flag is set', async () => {
        expect(billingVolume.twoPartTariffError).to.be.true();
      });

      test('the status code is set', async () => {
        expect(billingVolume.twoPartTariffStatus).to.equal(twoPartTariffStatuses.ERROR_RECEIVED);
      });
    });

    experiment('when some returns are due', () => {
      beforeEach(async () => {
        billingVolume.setTwoPartTariffStatus(twoPartTariffStatuses.ERROR_SOME_RETURNS_DUE, 20);
      });

      test('the volume is set', async () => {
        expect(billingVolume.volume).to.be.equal(20);
      });

      test('the calculatedVolume is undefined', async () => {
        expect(billingVolume.calculatedVolume).to.be.undefined();
      });

      test('the error flag is set', async () => {
        expect(billingVolume.twoPartTariffError).to.be.true();
      });

      test('the status code is set', async () => {
        expect(billingVolume.twoPartTariffStatus).to.equal(twoPartTariffStatuses.ERROR_SOME_RETURNS_DUE);
      });
    });

    experiment('when returns are received late', () => {
      beforeEach(async () => {
        billingVolume.setTwoPartTariffStatus(twoPartTariffStatuses.ERROR_LATE_RETURNS, 20);
      });

      test('the volume is set', async () => {
        expect(billingVolume.volume).to.be.equal(20);
      });

      test('the calculatedVolume is undefined', async () => {
        expect(billingVolume.calculatedVolume).to.be.undefined();
      });

      test('the error flag is not set', async () => {
        expect(billingVolume.twoPartTariffError).to.not.be.true();
      });

      test('the status code is set', async () => {
        expect(billingVolume.twoPartTariffStatus).to.equal(twoPartTariffStatuses.ERROR_LATE_RETURNS);
      });
    });

    experiment('when there is over abstraction', () => {
      beforeEach(async () => {
        billingVolume.setTwoPartTariffStatus(twoPartTariffStatuses.ERROR_OVER_ABSTRACTION, 20);
      });

      test('the volume and calculated volume are not set', async () => {
        expect(billingVolume.volume).to.be.undefined();
        expect(billingVolume.calculatedVolume).to.be.undefined();
      });

      test('the error flag is set', async () => {
        expect(billingVolume.twoPartTariffError).to.be.true();
      });

      test('the status code is set', async () => {
        expect(billingVolume.twoPartTariffStatus).to.equal(twoPartTariffStatuses.ERROR_OVER_ABSTRACTION);
      });
    });

    experiment('when there are no returns for matching', () => {
      beforeEach(async () => {
        billingVolume.setTwoPartTariffStatus(twoPartTariffStatuses.ERROR_NO_RETURNS_FOR_MATCHING, 20);
      });

      test('the volume and calculated volume are not set', async () => {
        expect(billingVolume.volume).to.be.undefined();
        expect(billingVolume.calculatedVolume).to.be.undefined();
      });

      test('the error flag is set', async () => {
        expect(billingVolume.twoPartTariffError).to.be.true();
      });

      test('the status code is set', async () => {
        expect(billingVolume.twoPartTariffStatus).to.equal(twoPartTariffStatuses.ERROR_NO_RETURNS_FOR_MATCHING);
      });
    });

    experiment('when the returns are not due for billing', () => {
      beforeEach(async () => {
        billingVolume.setTwoPartTariffStatus(twoPartTariffStatuses.ERROR_NOT_DUE_FOR_BILLING, 20);
      });

      test('the volume and calculated volume are not set', async () => {
        expect(billingVolume.volume).to.be.undefined();
        expect(billingVolume.calculatedVolume).to.be.undefined();
      });

      test('the error flag is set', async () => {
        expect(billingVolume.twoPartTariffError).to.be.true();
      });

      test('the status code is set', async () => {
        expect(billingVolume.twoPartTariffStatus).to.equal(twoPartTariffStatuses.ERROR_NOT_DUE_FOR_BILLING);
      });
    });

    experiment('when a return line overlaps the charge period start/end dates', () => {
      beforeEach(async () => {
        billingVolume.setTwoPartTariffStatus(twoPartTariffStatuses.ERROR_RETURN_LINE_OVERLAPS_CHARGE_PERIOD, 20);
      });

      test('the volume and calculated volume are not set', async () => {
        expect(billingVolume.volume).to.be.undefined();
        expect(billingVolume.calculatedVolume).to.be.undefined();
      });

      test('the error flag is set', async () => {
        expect(billingVolume.twoPartTariffError).to.be.true();
      });

      test('the status code is set', async () => {
        expect(billingVolume.twoPartTariffStatus).to.equal(twoPartTariffStatuses.ERROR_RETURN_LINE_OVERLAPS_CHARGE_PERIOD);
      });
    });
  });

  experiment('.allocate', () => {
    test('sets the volume and calculated volume if they are not yet set', async () => {
      billingVolume.allocate(5);
      expect(billingVolume.calculatedVolume).to.equal(5);
      expect(billingVolume.volume).to.equal(5);
    });

    test('adds the volume and calculated volume if they are aleady set', async () => {
      billingVolume.volume = 2.5;
      billingVolume.calculatedVolume = 2.5;
      billingVolume.allocate(5);
      expect(billingVolume.calculatedVolume).to.equal(7.5);
      expect(billingVolume.volume).to.equal(7.5);
    });

    test('throws an error if the argument is not a number', async () => {
      const func = () => { billingVolume.allocate('not-a-number'); };
      expect(func).to.throw();
    });

    test('throws an error if the  volume and calculated volume are different', async () => {
      billingVolume.volume = 1.2;
      billingVolume.calculatedVolume = 3;
      const func = () => { billingVolume.allocate(4.5); };
      expect(func).to.throw();
    });
  });

  experiment('.deallocate', () => {
    test('subtracts from the volume and calculated volume', async () => {
      billingVolume.volume = 2.5;
      billingVolume.calculatedVolume = 2.5;
      billingVolume.deallocate(1.2);
      expect(billingVolume.calculatedVolume).to.equal(1.3);
      expect(billingVolume.volume).to.equal(1.3);
    });

    test('can deallocate the full volume', async () => {
      billingVolume.volume = 2.5;
      billingVolume.calculatedVolume = 2.5;
      billingVolume.deallocate(2.5);
      expect(billingVolume.calculatedVolume).to.equal(0);
      expect(billingVolume.volume).to.equal(0);
    });

    test('throws an error if the argument is not a number', async () => {
      const func = () => { billingVolume.deallocate('not-a-number'); };
      expect(func).to.throw();
    });

    test('throws an error if the volume and calculated volume are different', async () => {
      billingVolume.volume = 1.2;
      billingVolume.calculatedVolume = 3;
      const func = () => { billingVolume.deallocate(1); };
      expect(func).to.throw();
    });

    test('throws an error if the deallocation volume exceeds the calculated volume', async () => {
      billingVolume.volume = 5;
      billingVolume.calculatedVolume = 5;
      const func = () => { billingVolume.deallocate(10); };
      expect(func).to.throw();
    });
  });

  experiment('.toFixed', async () => {
    test('rounds the volumes to 3DP precision', async () => {
      billingVolume.volume = 1 / 3;
      billingVolume.calculatedVolume = 2 / 3;
      billingVolume.toFixed();
      expect(billingVolume.volume).to.equal(0.333);
      expect(billingVolume.calculatedVolume).to.equal(0.667);
    });

    test('does nothing if volumes are null', async () => {
      billingVolume.volume = null;
      billingVolume.calculatedVolume = null;
      billingVolume.toFixed();
      expect(billingVolume.volume).to.be.null();
      expect(billingVolume.calculatedVolume).to.be.null();
    });

    test('returns itself', async () => {
      expect(billingVolume.toFixed()).to.equal(billingVolume);
    });
  });
});
